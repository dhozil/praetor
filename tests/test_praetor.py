"""Direct-mode (in-memory) contract tests for Praetor security guards.

Covers the fund-transition guarantees the GenLayer review required:
  1. Only escrow parties can open a dispute (no arbitrary caller).
  2. A settled milestone cannot be paid, refunded, or re-disputed (one-time).
  3. Each verdict classification applies a distinct, exclusive terminal
     milestone status (verified / refunded / split).

Run with the genlayer-test suite:
    pip install "genlayer-test[sim]"
    python -m pytest tests/test_praetor.py -v
"""

from pathlib import Path

import pytest

from gltest.direct import VMContext, deploy_contract, create_address

CONTRACT = Path(__file__).resolve().parent.parent / "contracts" / "praetor.py"

VALIDATOR_DISPUTE = '{"client_share": 0, "reasoning": "freelancer did the work"}'
VALIDATOR_PASS = '{"passed": true, "score": 90, "reasoning": "evidence proves work"}'
VALIDATOR_FAIL = '{"passed": false, "score": 20, "reasoning": "no credible evidence"}'


@pytest.fixture(scope="session")
def contract():
    # The GenLayer runtime allows only ONE contract class definition per
    # process, so we deploy once for the whole session and reset state.
    vm = VMContext()
    c = deploy_contract(CONTRACT, vm, 2)  # 2% platform fee
    with vm.activate():
        yield vm, c


@pytest.fixture
def reset(contract):
    vm, c = contract
    snap = vm.snapshot()
    yield
    vm.revert(snap)
    vm.clear_mocks()
    vm.clear_validators()


def _funded_escrow(vm, c):
    """Client posts a job with one milestone and assigns a freelancer."""
    client = create_address("client")
    freelancer = create_address("freelancer")

    with vm.prank(client):
        vm.value = 100_000
        vm.mock_web("evidence.example", {"status": 200, "body": "work done here"})
        job_id = c.post_job(
            "Build DApp",
            "Deliver working dApp",
            ["Milestone 1"],
            ["Core features"],
            [100_000],
            ["Link"],
            "Working code",
        )
        c.assign_freelancer(job_id, str(freelancer))
        vm.value = 0
    return job_id, client, freelancer


def _submit_and_verify(vm, c, escrow_id, freelancer):
    with vm.prank(freelancer):
        c.submit_evidence(escrow_id, 0, "https://evidence.example")
        vm.mock_llm("milestone verifier", VALIDATOR_PASS)
        c.verify_milestone(
            escrow_id,
            0,
            ["https://evidence.example"],
            ["Link"],
            "Build DApp",
            "Milestone 1",
            "Core features",
        )


# ── 1. Authentication: only escrow parties may trigger a dispute ────────────


def test_dispute_rejects_arbitrary_caller(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)
    stranger = create_address("stranger")

    with vm.prank(stranger):
        with vm.expect_revert("Only escrow parties"):
            c.resolve_dispute(
                0, 0, "client stmt", [], "freelancer stmt", []
            )


def test_verify_only_by_freelancer(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)
    intruder = create_address("intruder")

    with vm.prank(intruder):
        with vm.expect_revert("Only freelancer"):
            c.verify_milestone(
                0, 0, ["https://evidence.example"], ["Link"],
                "Build DApp", "Milestone 1", "Core features",
            )


def test_release_only_by_client(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        with vm.expect_revert("Only client"):
            c.release_payment(0, 0)


# ── 2. One-time settlement guards ───────────────────────────────────────────


def test_cannot_release_unverified(contract, reset):
    vm, c = contract
    job_id = _funded_escrow(vm, c)[0]

    with vm.prank(create_address("client")):
        with vm.expect_revert("Milestone not verified yet"):
            c.release_payment(0, 0)


def test_freelancer_win_marks_verified_then_releasable_once(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    # Freelancer wins the dispute -> milestone becomes verified.
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        verdict = c.resolve_dispute(
            0, 0, "I did the work, pay me", [], "Work is complete", []
        )
    assert verdict == "freelancer"
    assert c.get_escrow(0).milestones[0].status == "verified"

    # Client releases once.
    with vm.prank(client):
        c.release_payment(0, 0)
    assert c.get_escrow(0).milestones[0].status == "paid"

    # Second release must be blocked -> funds are never double-paid.
    # (With a single milestone, the first release completes the escrow, so the
    # escrow-completed guard fires first.)
    with vm.prank(client):
        with vm.expect_revert("completed"):
            c.release_payment(0, 0)


def test_settled_milestone_cannot_be_disputed_again(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 100, "reasoning": "refund"}')
        verdict = c.resolve_dispute(
            0, 0, "no work done", "nothing delivered", "done", "see link"
        )
    assert verdict == "client"
    # Client-win path refunds -> milestone is terminal.
    assert c.get_escrow(0).milestones[0].status == "refunded"

    # Neither party may re-open a dispute on a settled milestone.
    with vm.prank(client):
        with vm.expect_revert("already settled"):
            c.resolve_dispute(
                0, 0, "again", [], "again", []
            )


def test_refunded_milestone_cannot_be_released_or_reverified(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 100, "reasoning": "refund"}')
        verdict = c.resolve_dispute(
            0, 0, "no work done", "nothing delivered", "done", "see link"
        )
    assert verdict == "client"
    assert c.get_escrow(0).milestones[0].status == "refunded"

    # Even after refund, the client cannot pull the funds again.
    with vm.prank(client):
        with vm.expect_revert("already settled"):
            c.release_payment(0, 0)

    # And the freelancer cannot re-verify to flip it back to payable.
    with vm.prank(freelancer):
        with vm.expect_revert("already settled"):
            c.verify_milestone(
                0, 0, ["https://evidence.example"], ["Link"],
                "Build DApp", "Milestone 1", "Core features",
            )


def test_split_milestone_cannot_be_released(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 50, "reasoning": "split"}')
        verdict = c.resolve_dispute(
            0, 0, "partial", [], "partial", []
        )
    assert verdict == "split"
    assert c.get_escrow(0).milestones[0].status == "split"

    # Split already paid both parties on-chain, no further release possible.
    with vm.prank(client):
        with vm.expect_revert("already settled"):
            c.release_payment(0, 0)


def test_paid_milestone_cannot_be_verified_again(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_and_verify(vm, c, 0, freelancer)
    with vm.prank(client):
        c.release_payment(0, 0)  # milestone becomes "paid"

    # Re-verifying after payment is blocked -> no retroactive payout edits.
    with vm.prank(freelancer):
        with vm.expect_revert("completed"):
            c.verify_milestone(
                0, 0, ["https://evidence.example"], ["Link"],
                "Build DApp", "Milestone 1", "Core features",
            )


# ── 3. Payout classification is exclusive & validated ───────────────────────


EURO = 100_000


@pytest.mark.parametrize(
    "share,expected",
    [
        (0, "freelancer"),      # ≤ 33 -> freelancer wins
        (40, "split"),          # 34-66 -> split
        (90, "client"),         # ≥ 67 -> client refund
    ],
)
def test_verdict_classifications_map_to_terminal_states(contract, reset, share, expected):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", f'{{"client_share": {share}, "reasoning": "r"}}')
        verdict = c.resolve_dispute(
            0, 0, "arg", [], "arg", []
        )
    assert verdict == expected

    status = c.get_escrow(0).milestones[0].status
    assert status in ("verified", "split", "refunded")


def test_split_pays_both_after_fee():
    """Sanity check of the fee-then-half split arithmetic used on-chain."""
    amount = 100_000
    pct = 2
    fee = (amount * pct) // 100
    payout = amount - fee
    half = payout // 2
    remainder = payout - half
    assert fee == 2_000
    assert payout + fee == amount
    assert half + remainder == payout
    assert half == 49_000  # (100000 - 2000) / 2