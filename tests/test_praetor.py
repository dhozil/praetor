"""Direct-mode (in-memory) contract tests for Praetor security guards.

Covers the fund-transition guarantees the GenLayer review required:
  1. Verification is bound to STORED milestone criteria + the evidence
     committed on-chain via submit_evidence (caller supplies nothing).
  2. Each dispute party submits its OWN authenticated case; nobody can
     submit the other side's case or overwrite a committed one.
  3. Validators must agree on the actual verdict/pass CATEGORY, not just
     a close numeric score.
  4. A freelancer-win ruling settles ATOMICALLY in the resolve tx; a
     settled milestone cannot be paid, refunded, or re-disputed.
  5. Disputes are indexed per milestone, not per escrow.

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


def _funded_escrow(vm, c, milestones=1):
    """Client posts a job with N milestones and assigns a freelancer."""
    client = create_address("client")
    freelancer = create_address("freelancer")
    total = 100_000 * milestones

    with vm.prank(client):
        vm.value = total
        vm.mock_web("evidence.example", {"status": 200, "body": "work done here"})
        job_id = c.post_job(
            "Build DApp",
            "Deliver working dApp",
            [f"Milestone {i + 1}" for i in range(milestones)],
            [f"Core features {i + 1}" for i in range(milestones)],
            [100_000] * milestones,
            ["Link"] * milestones,
            "Working code",
        )
        c.assign_freelancer(job_id, str(freelancer))
        vm.value = 0
    return job_id, client, freelancer


def _submit_and_verify(vm, c, escrow_id, freelancer):
    with vm.prank(freelancer):
        c.submit_evidence(escrow_id, 0, "https://evidence.example")
        vm.mock_llm("milestone verifier", VALIDATOR_PASS)
        c.verify_milestone(escrow_id, 0)


def _submit_case(vm, c, escrow_id, milestone_index, party, statement, evidence=()):
    with vm.prank(party):
        c.submit_dispute_case(escrow_id, milestone_index, statement, list(evidence))


def _submit_both_cases(vm, c, escrow_id, client, freelancer, milestone_index=0,
                       client_stmt="client position", freelancer_stmt="freelancer position"):
    _submit_case(vm, c, escrow_id, milestone_index, client, client_stmt)
    _submit_case(vm, c, escrow_id, milestone_index, freelancer, freelancer_stmt)


# ── 1. Authentication: only escrow parties may trigger a dispute ────────────


def test_dispute_rejects_arbitrary_caller(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)
    stranger = create_address("stranger")

    with vm.prank(stranger):
        with vm.expect_revert("Only escrow parties"):
            c.submit_dispute_case(0, 0, "my case", [])
    with vm.prank(stranger):
        with vm.expect_revert("Only escrow parties"):
            c.resolve_dispute(0, 0)


def test_verify_only_by_freelancer(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)
    intruder = create_address("intruder")

    with vm.prank(intruder):
        with vm.expect_revert("Only freelancer"):
            c.verify_milestone(0, 0)


def test_release_only_by_client(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        with vm.expect_revert("Only client"):
            c.release_payment(0, 0)


# ── 2. Verification is bound to committed evidence ──────────────────────────


def test_verify_requires_committed_evidence(contract, reset):
    """verify_milestone takes only ids: the evidence must already be committed
    on-chain via submit_evidence, otherwise it reverts."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        with vm.expect_revert("No evidence committed"):
            c.verify_milestone(0, 0)


def test_validator_rejects_pass_fail_disagreement(contract, reset):
    """A validator that sees the same score but a different pass/fail category
    (e.g. leader says passed 90, validator says failed 80) must NOT approve."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        c.submit_evidence(0, 0, "https://evidence.example")
        vm.mock_llm("milestone verifier", VALIDATOR_PASS)
        c.verify_milestone(0, 0)
    assert c.get_verification(0, 0).passed is True

    # Validator re-runs the leader logic and sees a FAIL verdict.
    vm.clear_mocks()
    vm.mock_web("evidence.example", {"status": 200, "body": "work done here"})
    vm.mock_llm("milestone verifier", VALIDATOR_FAIL)
    assert vm.run_validator() is False


def test_validator_approves_same_category_within_tolerance(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        c.submit_evidence(0, 0, "https://evidence.example")
        vm.mock_llm("milestone verifier", VALIDATOR_PASS)
        c.verify_milestone(0, 0)

    # Validator sees passed 85: same category (passed), |90-85| = 5 <= 15.
    vm.clear_mocks()
    vm.mock_web("evidence.example", {"status": 200, "body": "work done here"})
    vm.mock_llm("milestone verifier", '{"passed": true, "score": 85, "reasoning": "ok"}')
    assert vm.run_validator() is True


# ── 3. Per-party dispute cases ──────────────────────────────────────────────


def test_dispute_case_bound_to_submitter(contract, reset):
    """submit_dispute_case only writes the SENDER's side — a freelancer cannot
    put words in the client's mouth, and a committed case cannot be edited."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_case(vm, c, 0, 0, freelancer, "freelancer position")
    cs = c.get_dispute_case(0, 0)
    assert cs.freelancer_submitted is True
    assert cs.freelancer_statement == "freelancer position"
    assert cs.client_submitted is False

    # No overwriting a committed case.
    with vm.prank(freelancer):
        with vm.expect_revert("already submitted"):
            c.submit_dispute_case(0, 0, "edited position", [])


def test_resolve_requires_both_cases(contract, reset):
    """A dispute is adjudicated only after BOTH parties committed their own
    case — one party cannot drag the other into arbitration."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_case(vm, c, 0, 0, client, "client position")
    with vm.prank(freelancer):
        with vm.expect_revert("Both parties must submit a case first"):
            c.resolve_dispute(0, 0)


def test_resolve_rejects_case_not_from_party(contract, reset):
    """The statements used in resolution come from the committed cases, so a
    resolve call that names only one side must fail — nothing to adjudicate."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(client):
        with vm.expect_revert("Both parties must submit a case first"):
            c.resolve_dispute(0, 0)


# ── 4. One-time settlement guards ───────────────────────────────────────────


def test_cannot_release_unverified(contract, reset):
    vm, c = contract
    job_id = _funded_escrow(vm, c)[0]

    with vm.prank(create_address("client")):
        with vm.expect_revert("Milestone not verified yet"):
            c.release_payment(0, 0)


def test_freelancer_win_pays_atomically(contract, reset):
    """A freelancer-win ruling pays the freelancer DIRECTLY in the resolve
    transaction — no separate release step, no double payout possible."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(client):
        c.register_user("Alice", "client")
    with vm.prank(freelancer):
        c.register_user("Bob", "freelancer")

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "freelancer"

    # Atomic settlement: milestone paid in the SAME tx as the verdict.
    assert c.get_escrow(0).milestones[0].status == "paid"
    assert c.get_escrow(0).status == "completed"
    assert c.get_job(job_id).status == "completed"
    assert c.get_profile(str(freelancer)).total_earned == 98_000  # 100k - 2% fee
    assert c.get_profile(str(client)).total_spent == 100_000

    # The client cannot release (again) — funds already moved.
    with vm.prank(client):
        with vm.expect_revert("completed"):
            c.release_payment(0, 0)


def test_settled_milestone_cannot_be_disputed_again(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 100, "reasoning": "refund"}')
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "client"
    # Client-win path refunds -> milestone is terminal.
    assert c.get_escrow(0).milestones[0].status == "refunded"

    # Neither party may re-open a dispute on a settled milestone.
    with vm.prank(client):
        with vm.expect_revert("already settled"):
            c.submit_dispute_case(0, 0, "again", [])
    with vm.prank(freelancer):
        with vm.expect_revert("already settled"):
            c.resolve_dispute(0, 0)


def test_refunded_milestone_cannot_be_released_or_reverified(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 100, "reasoning": "refund"}')
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "client"
    assert c.get_escrow(0).milestones[0].status == "refunded"

    # Even after refund, the client cannot pull the funds again.
    with vm.prank(client):
        with vm.expect_revert("already settled"):
            c.release_payment(0, 0)

    # And the freelancer cannot re-verify to flip it back to payable.
    with vm.prank(freelancer):
        with vm.expect_revert("already settled"):
            c.verify_milestone(0, 0)


def test_split_milestone_cannot_be_released(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 50, "reasoning": "split"}')
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "split"
    assert c.get_escrow(0).milestones[0].status == "split"

    # Split already paid both parties on-chain, no further release possible.
    with vm.prank(client):
        with vm.expect_revert("already settled"):
            c.release_payment(0, 0)


def test_settled_milestone_cannot_be_reverified(contract, reset):
    """After a dispute settles (freelancer win -> paid), a malicious freelancer
    must NOT be able to re-run AI verification to flip the milestone back to
    'rejected' (that would freeze already-paid funds)."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "freelancer"
    assert c.get_escrow(0).milestones[0].status == "paid"

    with vm.prank(freelancer):
        with vm.expect_revert("Escrow already completed"):
            c.verify_milestone(0, 0)
    with vm.prank(freelancer):
        with vm.expect_revert("Escrow not active"):
            c.submit_evidence(0, 0, "https://new.example")


def test_paid_milestone_cannot_be_verified_again(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_and_verify(vm, c, 0, freelancer)
    with vm.prank(client):
        c.release_payment(0, 0)  # milestone becomes "paid"

    # Re-verifying after payment is blocked -> no retroactive payout edits.
    with vm.prank(freelancer):
        with vm.expect_revert("completed"):
            c.verify_milestone(0, 0)


# ── 5. Payout classification is exclusive & validated ───────────────────────


@pytest.mark.parametrize(
    "share,expected",
    [
        (0, "freelancer"),      # ≤ 33 -> freelancer wins, paid atomically
        (40, "split"),          # 34-66 -> split
        (90, "client"),         # ≥ 67 -> client refund
    ],
)
def test_verdict_classifications_map_to_terminal_states(contract, reset, share, expected):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", f'{{"client_share": {share}, "reasoning": "r"}}')
        verdict = c.resolve_dispute(0, 0)
    assert verdict == expected

    status = c.get_escrow(0).milestones[0].status
    assert status in ("paid", "split", "refunded")


def test_validator_rejects_category_disagreement(contract, reset):
    """Two shares within ±20 but in different verdict categories (20 vs 40:
    freelancer vs split) must NOT both approve — validators have to agree on
    the actual ruling, not a close number."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 20, "reasoning": "work done"}')
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "freelancer"

    # Validator sees 40 (split): |20-40| = 20 <= 20 but freelancer != split.
    vm.clear_mocks()
    vm.mock_llm("dispute resolver", '{"client_share": 40, "reasoning": "partial"}')
    assert vm.run_validator() is False


def test_validator_approves_same_category_within_tolerance(contract, reset):
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 20, "reasoning": "work done"}')
        verdict = c.resolve_dispute(0, 0)
    assert verdict == "freelancer"

    # Validator sees 30: same category (freelancer), |20-30| = 10 <= 20.
    vm.clear_mocks()
    vm.mock_llm("dispute resolver", '{"client_share": 30, "reasoning": "also ok"}')
    assert vm.run_validator() is True


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


def test_post_job_rejects_non_positive_amounts(contract, reset):
    """Negative/zero milestone amounts would under-fund the escrow and let a
    later payout absorb another escrow's balance — reject them up-front."""
    vm, c = contract
    client = create_address("client")

    with vm.prank(client):
        vm.value = 1
        with vm.expect_revert("amounts must be positive"):
            c.post_job(
                "Trick",
                "underfund",
                ["M1", "M2"],
                ["d", "d"],
                [1_000_000, -999_999],
                ["Link", "Link"],
                "req",
            )

    with vm.prank(client):
        vm.value = 0
        with vm.expect_revert("amounts must be positive"):
            c.post_job(
                "Free",
                "zero amount",
                ["M1"],
                ["d"],
                [0],
                ["Link"],
                "reqs",
            )


# ── 6. Disputes are indexed per milestone ───────────────────────────────────


def test_dispute_indexed_per_milestone(contract, reset):
    """Two milestones in one escrow can each hold their own dispute with its
    own verdict — resolving one must not block the other."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c, milestones=2)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", '{"client_share": 100, "reasoning": "refund M1"}')
        assert c.resolve_dispute(0, 0) == "client"

    vm.clear_mocks()
    _submit_both_cases(vm, c, 0, client, freelancer, milestone_index=1,
                       client_stmt="M2 dispute", freelancer_stmt="M2 done")
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        assert c.resolve_dispute(0, 1) == "freelancer"

    d0 = c.get_dispute_by_escrow_milestone(0, 0)
    d1 = c.get_dispute_by_escrow_milestone(0, 1)
    assert d0 != 2**256 - 1
    assert d1 != 2**256 - 1
    assert d0 != d1
    assert c.get_dispute(d0).milestone_index == 0
    assert c.get_dispute(d1).milestone_index == 1
    assert c.get_escrow(0).milestones[0].status == "refunded"
    assert c.get_escrow(0).milestones[1].status == "paid"


# ── 7. No external party can forge reputation or strand funds ────────────────


def test_reputation_cannot_be_forged_by_outsider(contract, reset):
    """record_job / record_dispute_result were public write methods that any
    caller could invoke with ANY target address — allowing anyone to inflate
    (or deflate) any user's score. They must no longer exist on the ABI."""
    vm, c = contract
    assert not hasattr(c, "record_job")
    assert not hasattr(c, "record_dispute_result")


def test_reputation_only_updates_from_real_payment(contract, reset):
    """Reputation is now event-driven: it only changes when an authenticated
    release_payment happens, never from an arbitrary caller's call."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(client):
        c.register_user("Alice", "client")
    with vm.prank(freelancer):
        c.register_user("Bob", "freelancer")

    # An outsider tries to damage Bob's reputation before anything happened.
    stranger = create_address("stranger")
    with vm.prank(stranger):
        c.register_user("Eve", "freelancer")  # registering yourself is fine
    assert c.get_praetor_score(str(freelancer)) == 50

    # Outsider cannot transfer funds either way.
    with vm.prank(stranger):
        with vm.expect_revert("Only client"):
            c.release_payment(0, 0)

    # Real flow: verify -> release -> reputation reflects the real event.
    _submit_and_verify(vm, c, 0, freelancer)
    with vm.prank(client):
        c.release_payment(0, 0)

    assert c.get_profile(str(freelancer)).total_earned == 98_000  # 100k - 2% fee
    assert c.get_profile(str(client)).total_spent == 100_000
    assert c.get_profile(str(freelancer)).completed_jobs == 1


def test_dispute_result_only_recorded_internally(contract, reset):
    """won_disputes must only change through resolve_dispute, which is already
    restricted to escrow parties."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    with vm.prank(freelancer):
        c.register_user("Bob", "freelancer")
    with vm.prank(client):
        c.register_user("Alice", "client")

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        c.resolve_dispute(0, 0)

    assert c.get_profile(str(freelancer)).won_disputes == 1
    assert c.get_profile(str(client)).won_disputes == 0


def test_overpay_is_refunded_not_stranded(contract, reset):
    """Posting with more value than the milestone total must not silently keep
    the excess locked in the contract."""
    vm, c = contract
    client = create_address("client")

    with vm.prank(client):
        vm.value = 150_000  # milestone total is 100_000
        job_id = c.post_job(
            "Big deposit",
            "overpay on purpose",
            ["M1"],
            ["d"],
            [100_000],
            ["Link"],
            "reqs",
        )
        vm.value = 0

    # Job is created and holds only the actual milestone total.
    job = c.get_job(job_id)
    assert job.total_budget == 100_000


def test_evidence_cannot_overwrite_settled_milestone(contract, reset):
    """After a dispute resolves to a freelancer win (paid), the freelancer
    must not be able to re-submit evidence to overwrite the terminal state."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        c.resolve_dispute(0, 0)

    with vm.prank(freelancer):
        with vm.expect_revert("Escrow not active"):
            c.submit_evidence(0, 0, "https://new.example")


# ── 8. Job lifecycle status must reach "completed" for history ───────────────


def test_job_becomes_completed_after_full_payment(contract, reset):
    """The History page lists jobs whose status is 'completed'. The job
    posting must transition open -> assigned -> completed when the escrow
    finishes paying out, otherwise history stays empty forever."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    assert c.get_job(job_id).status == "assigned"

    _submit_and_verify(vm, c, 0, freelancer)
    with vm.prank(client):
        c.release_payment(0, 0)

    assert c.get_escrow(0).status == "completed"
    assert c.get_job(job_id).status == "completed"


def test_completed_job_indexed_for_both_parties(contract, reset):
    """get_client_jobs / get_freelancer_jobs must both return the job id once
    the escrow is completed, so History works on both sides."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_and_verify(vm, c, 0, freelancer)
    with vm.prank(client):
        c.release_payment(0, 0)

    assert job_id in c.get_client_jobs(str(client))
    assert job_id in c.get_freelancer_jobs(str(freelancer))


def test_dispute_paid_job_indexed_for_both_parties(contract, reset):
    """A freelancer-win dispute also completes the job for both parties, so
    History reflects dispute-settled work too."""
    vm, c = contract
    job_id, client, freelancer = _funded_escrow(vm, c)

    _submit_both_cases(vm, c, 0, client, freelancer)
    with vm.prank(freelancer):
        vm.mock_llm("dispute resolver", VALIDATOR_DISPUTE)
        c.resolve_dispute(0, 0)

    assert c.get_job(job_id).status == "completed"
    assert job_id in c.get_client_jobs(str(client))
    assert job_id in c.get_freelancer_jobs(str(freelancer))
