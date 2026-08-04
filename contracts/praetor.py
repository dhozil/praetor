# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass


# EVM contract interface for sending value to EOAs / chain-layer accounts
@gl.evm.contract_interface
class _EOA:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class Milestone:
    title: str
    description: str
    amount: u256
    evidence_types: str
    status: str
    evidence_urls: DynArray[str]
    ai_score: u8
    verified: bool


@allow_storage
@dataclass
class JobPosting:
    title: str
    description: str
    client: Address
    total_budget: u256
    milestone_titles: DynArray[str]
    milestone_amounts: DynArray[u256]
    milestone_descriptions: DynArray[str]
    evidence_types: DynArray[str]
    requirements: str
    status: str
    applicants: DynArray[Address]
    assigned_freelancer: Address
    created_at: u256


@allow_storage
@dataclass
class Escrow:
    job_id: u256
    job_title: str
    job_description: str
    client: Address
    freelancer: Address
    budget: u256
    milestones: DynArray[Milestone]
    status: str
    created_at: u256
    dispute_open: bool
    winner: Address


@allow_storage
@dataclass
class VerificationResult:
    passed: bool
    score: u8
    reasoning: str
    evidence_count: u8


@allow_storage
@dataclass
class DisputeStatement:
    party_address: Address
    statement: str
    evidence_urls: DynArray[str]


@allow_storage
@dataclass
class DisputeCase:
    """Per-milestone dispute case, filled by each escrow party itself."""
    client_statement: str
    client_evidence: DynArray[str]
    client_submitted: bool
    freelancer_statement: str
    freelancer_evidence: DynArray[str]
    freelancer_submitted: bool


@allow_storage
@dataclass
class Dispute:
    escrow_id: u256
    milestone_index: u256
    client_statement: DisputeStatement
    freelancer_statement: DisputeStatement
    verdict: str
    resolved: bool
    reasoning: str


@allow_storage
@dataclass
class ReputationProfile:
    display_name: str
    total_jobs: u256
    completed_jobs: u256
    disputed_jobs: u256
    won_disputes: u256
    total_earned: u256
    total_spent: u256
    praetor_score: u256
    role: str


@allow_storage
@dataclass
class AuditEvent:
    event_id: u256
    event_type: str
    escrow_id: u256
    actor: Address
    description: str
    metadata: str


# ─── Main Contract ──────────────────────────────────────────────────────────

class PraetorV2(gl.Contract):

    # Marketplace
    job_counter: u256
    job_postings: TreeMap[u256, JobPosting]
    open_job_ids: DynArray[u256]
    client_job_ids: TreeMap[Address, DynArray[u256]]
    freelancer_job_ids: TreeMap[Address, DynArray[u256]]

    # Escrow
    escrow_counter: u256
    escrows: TreeMap[u256, Escrow]
    job_to_escrow: TreeMap[u256, u256]

    # Verification
    verifications: TreeMap[str, VerificationResult]

    # Dispute
    dispute_counter: u256
    disputes: TreeMap[u256, Dispute]
    dispute_by_milestone: TreeMap[str, u256]
    dispute_cases: TreeMap[str, DisputeCase]

    # Reputation
    profiles: TreeMap[Address, ReputationProfile]

    # Audit
    event_counter: u256
    audit_events: TreeMap[u256, AuditEvent]
    escrow_event_index: TreeMap[u256, DynArray[u256]]

    # Fee
    platform_fee_percent: u8

    def __init__(self, platform_fee_percent: int):
        self.job_counter = u256(0)
        self.escrow_counter = u256(0)
        self.platform_fee_percent = int(platform_fee_percent)
        self.dispute_counter = u256(0)
        self.event_counter = u256(0)

    # ── Marketplace: Job Posting ─────────────────────────────────────────────

    @gl.public.write.payable
    def post_job(
        self,
        title: str,
        description: str,
        milestone_titles: DynArray[str],
        milestone_descriptions: DynArray[str],
        milestone_amounts: DynArray[int],
        evidence_types: DynArray[str],
        requirements: str,
    ) -> int:
        if len(milestone_titles) == 0:
            raise gl.vm.UserError("At least one milestone required")
        if len(milestone_titles) != len(milestone_descriptions):
            raise gl.vm.UserError("Titles and descriptions must match")
        if len(milestone_titles) != len(milestone_amounts):
            raise gl.vm.UserError("Titles and amounts must match")

        total = u256(0)
        for amt in milestone_amounts:
            if int(amt) <= 0:
                raise gl.vm.UserError("Milestone amounts must be positive")
            total = total + u256(int(amt))
        if gl.message.value < total:
            raise gl.vm.UserError("Insufficient funds sent")

        # Refund any overpayment immediately so no value is ever stranded.
        if gl.message.value > total:
            overpay = int(gl.message.value) - int(total)
            if overpay > 0:
                _EOA(gl.message.sender_address).emit_transfer(value=u256(overpay))

        job_id = self.job_counter
        self.job_counter = self.job_counter + u256(1)

        self.job_postings[job_id] = JobPosting(
            title=title,
            description=description,
            client=gl.message.sender_address,
            total_budget=total,
            milestone_titles=milestone_titles,
            milestone_amounts=milestone_amounts,
            milestone_descriptions=milestone_descriptions,
            evidence_types=evidence_types,
            requirements=requirements,
            status="open",
            applicants=[],
            assigned_freelancer=Address("0x0000000000000000000000000000000000000000"),
            created_at=u256(0),
        )

        self.open_job_ids.append(job_id)

        # Index by client
        if gl.message.sender_address in self.client_job_ids:
            self.client_job_ids[gl.message.sender_address].append(job_id)
        else:
            self.client_job_ids[gl.message.sender_address] = [job_id]

        self._log_event("job_posted", job_id, f"Job posted: {title}")
        return job_id

    @gl.public.write
    def apply_job(self, job_id: int):
        job = self.job_postings[job_id]
        if job.status != "open":
            raise gl.vm.UserError("Job is not open")
        sender = gl.message.sender_address
        if sender == job.client:
            raise gl.vm.UserError("Client cannot apply to their own job")
        for a in job.applicants:
            if a == sender:
                raise gl.vm.UserError("Already applied")
        job.applicants.append(sender)
        self.job_postings[job_id] = job
        self._log_event("job_applied", job_id, f"Freelancer applied to job #{job_id}")

    @gl.public.write
    def assign_freelancer(self, job_id: int, freelancer_address: str):
        job = self.job_postings[job_id]
        if job.status != "open":
            raise gl.vm.UserError("Job is not open")
        if gl.message.sender_address != job.client:
            raise gl.vm.UserError("Only client can assign")

        freelancer = Address(freelancer_address)
        if freelancer == job.client:
            raise gl.vm.UserError("Cannot assign the client as freelancer")

        # Create escrow from job
        escrow_id = self._create_escrow_from_job(job, freelancer, job_id)

        job.status = "assigned"
        job.assigned_freelancer = freelancer
        self.job_postings[job_id] = job

        # Remove from open list
        new_open: DynArray[u256] = []
        for oid in self.open_job_ids:
            if oid != job_id:
                new_open.append(oid)
        self.open_job_ids = new_open

        # Index by freelancer
        if freelancer in self.freelancer_job_ids:
            self.freelancer_job_ids[freelancer].append(job_id)
        else:
            self.freelancer_job_ids[freelancer] = [job_id]

        self.job_to_escrow[job_id] = escrow_id
        self._log_event("freelancer_assigned", escrow_id,
                        f"Freelancer assigned to job #{job_id}, escrow #{escrow_id}")

    def _create_escrow_from_job(self, job: JobPosting, freelancer: Address, job_id: int) -> int:
        escrow_id = self.escrow_counter
        self.escrow_counter = self.escrow_counter + u256(1)

        milestones: DynArray[Milestone] = []
        for i in range(len(job.milestone_titles)):
            milestones.append(Milestone(
                title=job.milestone_titles[i],
                description=job.milestone_descriptions[i],
                amount=int(job.milestone_amounts[i]),
                evidence_types=job.evidence_types[i] if i < len(job.evidence_types) else "",
                status="pending",
                evidence_urls=[],
                ai_score=u8(0),
                verified=False,
            ))

        self.escrows[escrow_id] = Escrow(
            job_id=job_id,
            job_title=job.title,
            job_description=job.description,
            client=job.client,
            freelancer=freelancer,
            budget=job.total_budget,
            milestones=milestones,
            status="active",
            created_at=u256(0),
            dispute_open=False,
            winner=Address("0x0000000000000000000000000000000000000000"),
        )
        return escrow_id

    # ── Marketplace: View Methods ────────────────────────────────────────────

    @gl.public.view
    def get_open_jobs(self) -> DynArray[int]:
        return self.open_job_ids

    @gl.public.view
    def get_job(self, job_id: int) -> JobPosting:
        return self.job_postings[job_id]

    @gl.public.view
    def get_applicants(self, job_id: int) -> DynArray[Address]:
        return self.job_postings[job_id].applicants

    @gl.public.view
    def get_client_jobs(self, client_address: str) -> DynArray[int]:
        addr = Address(client_address)
        if addr not in self.client_job_ids:
            return []
        return self.client_job_ids[addr]

    @gl.public.view
    def get_freelancer_jobs(self, freelancer_address: str) -> DynArray[int]:
        addr = Address(freelancer_address)
        if addr not in self.freelancer_job_ids:
            return []
        return self.freelancer_job_ids[addr]

    @gl.public.view
    def get_job_by_escrow(self, escrow_id: int) -> int:
        for jid in self.job_postings:
            if self.job_postings[jid].status == "assigned":
                if jid in self.job_to_escrow and self.job_to_escrow[jid] == escrow_id:
                    return jid
        return u256(2**256 - 1)

    @gl.public.view
    def get_escrow_by_job(self, job_id: int) -> int:
        if job_id not in self.job_to_escrow:
            return u256(2**256 - 1)
        return self.job_to_escrow[job_id]

    @gl.public.view
    def get_escrow_counter(self) -> int:
        return self.escrow_counter

    # ── Escrow View Methods ──────────────────────────────────────────────────

    @gl.public.view
    def get_escrow(self, escrow_id: int) -> Escrow:
        return self.escrows[escrow_id]

    @gl.public.view
    def get_escrow_status(self, escrow_id: int) -> str:
        return self.escrows[escrow_id].status

    # ── Escrow Write Methods ─────────────────────────────────────────────────

    @gl.public.write
    def submit_evidence(self, escrow_id: int, milestone_index: int, evidence_urls: DynArray[str]):
        escrow = self.escrows[escrow_id]
        if gl.message.sender_address != escrow.freelancer:
            raise gl.vm.UserError("Only freelancer can submit evidence")
        if escrow.status != "active":
            raise gl.vm.UserError("Escrow not active")

        idx = int(milestone_index)
        if idx < 0 or idx >= len(escrow.milestones):
            raise gl.vm.UserError("Invalid milestone index")
        if not evidence_urls:
            raise gl.vm.UserError("At least one evidence URL required")
        ms = escrow.milestones[idx]
        if ms.status in ("paid", "refunded", "split", "verified"):
            raise gl.vm.UserError("Milestone already settled")
        ms.evidence_urls = evidence_urls
        ms.status = "evidence_submitted"
        escrow.milestones[idx] = ms
        self.escrows[escrow_id] = escrow
        self._log_event("evidence_submitted", escrow_id,
                        f"Milestone {milestone_index} evidence submitted ({len(evidence_urls)} URL(s))")

    @gl.public.write
    def release_payment(self, escrow_id: int, milestone_index: int):
        escrow = self.escrows[escrow_id]
        if gl.message.sender_address != escrow.client:
            raise gl.vm.UserError("Only client can release payment")
        if escrow.status == "completed":
            raise gl.vm.UserError("Escrow already completed")

        idx = int(milestone_index)
        if idx < 0 or idx >= len(escrow.milestones):
            raise gl.vm.UserError("Invalid milestone index")
        ms = escrow.milestones[idx]
        if ms.status in ("paid", "refunded", "split"):
            raise gl.vm.UserError("Milestone already settled")
        if not ms.verified:
            raise gl.vm.UserError("Milestone not verified yet")

        amount = int(ms.amount)
        pct = int(self.platform_fee_percent)
        fee = (amount * pct) // 100
        payout = int(amount - fee)

        ms.status = "paid"
        escrow.milestones[idx] = ms

        freelancer = _EOA(escrow.freelancer)
        freelancer.emit_transfer(value=u256(payout))

        all_paid = True
        for m in escrow.milestones:
            if m.status != "paid":
                all_paid = False
                break
        if all_paid:
            escrow.status = "completed"
            job = self.job_postings[escrow.job_id]
            job.status = "completed"
            self.job_postings[escrow.job_id] = job

        self.escrows[escrow_id] = escrow
        self._log_event("payment_released", escrow_id,
                        f"Paid {payout} wei to freelancer")

        # Reputation is event-driven from the authenticated release: the client
        # spent the amount, the freelancer earned the payout after fee.
        self._record_job_completed(str(escrow.client), "client", amount)
        self._record_job_completed(str(escrow.freelancer), "freelancer", payout)

    # ── AI Verification ─────────────────────────────────────────────────────

    @gl.public.write
    def verify_milestone(
        self,
        escrow_id: int,
        milestone_index: int,
    ) -> VerificationResult:
        """Verify a milestone using ONLY the stored milestone criteria and the
        evidence that was committed on-chain via submit_evidence. No caller
        supplies the criteria or the evidence, so verification cannot be
        swayed by the party submitting it."""
        escrow = self.escrows[escrow_id]
        if escrow.status == "completed":
            raise gl.vm.UserError("Escrow already completed")
        if gl.message.sender_address != escrow.freelancer:
            raise gl.vm.UserError("Only freelancer can verify")

        idx = int(milestone_index)
        if idx < 0 or idx >= len(escrow.milestones):
            raise gl.vm.UserError("Invalid milestone index")
        ms = escrow.milestones[idx]
        if ms.status in ("paid", "refunded", "split", "verified"):
            raise gl.vm.UserError("Milestone already settled")

        # Verification is bound to the committed on-chain evidence.
        job = self.job_postings[escrow.job_id]
        evidence_type = job.evidence_types[idx] if idx < len(job.evidence_types) else ""

        # Flatten storage classes to plain strings BEFORE the nondet closures:
        # leader/validator functions get pickled for the validators, and the
        # runtime does not support reading storage inside nondet mode.
        job_title = str(escrow.job_title)
        job_desc = str(escrow.job_description)
        ms_title = str(ms.title)
        ms_desc = str(ms.description)
        evidence_type = str(evidence_type)
        committed_urls = [str(u) for u in ms.evidence_urls]
        if len(committed_urls) == 0:
            raise gl.vm.UserError("No evidence committed — call submit_evidence first")

        def parse_verdict(res) -> tuple:
            # Robust coercion: the LLM may return "passed" as a string
            # ("false") or a number (1/0). Naive bool("false") == True would
            # flip a FAIL into a PASS, so parse strictly.
            passed = res.get("passed", False)
            if isinstance(passed, bool):
                pb = passed
            elif isinstance(passed, (int, float)):
                pb = passed != 0
            elif isinstance(passed, str):
                pb = passed.strip().lower() in ("true", "1", "yes")
            else:
                pb = False
            raw = res.get("score", 0)
            try:
                score = int(raw)
            except (TypeError, ValueError):
                try:
                    score = int(float(raw))
                except (TypeError, ValueError):
                    score = 0
            return pb, max(0, min(100, score))

        def leader_fn() -> dict:
            evidence_details = ""
            for i, url in enumerate(committed_urls):
                evidence_details += f"\n   Evidence #{i + 1}: {url}"
                try:
                    if evidence_type == "GitHub":
                        resp = gl.nondet.web.get(url)
                        content = resp.body.decode("utf-8")
                    else:
                        content = gl.nondet.web.render(url, mode="text")
                    evidence_details += f"\n     Fetched content: {str(content)[:1200]}"
                except Exception:
                    evidence_details += "\n     (Could not fetch content)"

            prompt = f"""
You are an AI milestone verifier for Praetor escrow platform.
Evaluate whether the COMMITTED evidence demonstrates completion of the stored milestone criteria.

JOB: {job_title} — {job_desc}
MILESTONE: {ms_title} - {ms_desc}
REQUIRED EVIDENCE TYPE: {evidence_type}

COMMITTED EVIDENCE ({len(committed_urls)} URL(s)):
{evidence_details}

RULES:
- The committed evidence MUST be relevant, credible proof of the milestone deliverables
- Evaluate ALL evidence URLs together; any one of them showing real completion counts
- Prefer decisive evidence; if only cursory or unrelated content is shown, FAIL
- Score 0-100 based on evidence quality and completeness
- Explain your reasoning, referencing specific content from the evidence

Respond ONLY as JSON:
{{"passed": bool, "score": int, "reasoning": "string"}}
"""
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(res, dict):
                raise gl.vm.UserError("Invalid LLM response")
            passed, score = parse_verdict(res)
            return {
                "passed": passed,
                "score": score,
                "reasoning": str(res.get("reasoning", "")),
            }

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict) or "score" not in data:
                return False
            score = data.get("score")
            passed = data.get("passed", False)
            if not isinstance(score, int) or not (0 <= score <= 100):
                return False
            my = leader_fn()
            if not isinstance(my, dict) or "score" not in my:
                return False
            # Validators must agree on the ACTUAL pass/fail category, not only
            # the numeric score, so a borderline disagreement cannot slip by.
            if my["passed"] != passed:
                return False
            return abs(my["score"] - score) <= 15

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        verification = VerificationResult(
            passed=result["passed"],
            score=u8(result["score"]),
            reasoning=result["reasoning"],
            evidence_count=u8(len(committed_urls)),
        )

        key = f"{escrow_id}_{milestone_index}"
        self.verifications[key] = verification

        ms.verified = result["passed"]
        ms.ai_score = u8(result["score"])
        ms.status = "verified" if result["passed"] else "rejected"
        escrow.milestones[idx] = ms
        self.escrows[escrow_id] = escrow

        self._log_event("milestone_verified", escrow_id,
                        f"Milestone {milestone_index}: {'PASSED' if result['passed'] else 'FAILED'} (score: {result['score']})")
        return verification

    @gl.public.view
    def is_verified(self, escrow_id: int, milestone_index: int) -> bool:
        key = f"{escrow_id}_{milestone_index}"
        if key not in self.verifications:
            return False
        return self.verifications[key].passed

    @gl.public.view
    def get_verification(self, escrow_id: int, milestone_index: int) -> VerificationResult:
        key = f"{escrow_id}_{milestone_index}"
        if key not in self.verifications:
            return VerificationResult(passed=False, score=u8(0), reasoning="Not verified", evidence_count=u8(0))
        return self.verifications[key]

    # ── Dispute Methods ─────────────────────────────────────────────────────

    @gl.public.write
    def submit_dispute_case(
        self,
        escrow_id: int,
        milestone_index: int,
        statement: str,
        evidence_urls: DynArray[str],
    ):
        """Each escrow party submits its OWN authenticated case. The sender can
        only write their own side; nobody can put words in the other party's
        mouth (no single caller can supply both statements anymore)."""
        escrow = self.escrows[escrow_id]
        if escrow.status == "completed":
            raise gl.vm.UserError("Escrow already completed")

        sender = gl.message.sender_address
        if sender != escrow.client and sender != escrow.freelancer:
            raise gl.vm.UserError("Only escrow parties can open a dispute")

        idx = int(milestone_index)
        if idx < 0 or idx >= len(escrow.milestones):
            raise gl.vm.UserError("Invalid milestone index")

        ms = escrow.milestones[idx]
        if ms.status in ("paid", "refunded", "split"):
            raise gl.vm.UserError("Milestone already settled")
        if ms.status == "verified":
            raise gl.vm.UserError("Milestone already verified — release payment instead")

        key = f"{escrow_id}_{milestone_index}"
        case = self.dispute_cases.get(key, DisputeCase(
            client_statement="", client_evidence=[], client_submitted=False,
            freelancer_statement="", freelancer_evidence=[], freelancer_submitted=False,
        ))

        if sender == escrow.client:
            if case.client_submitted:
                raise gl.vm.UserError("Client case already submitted")
            case.client_statement = statement
            case.client_evidence = evidence_urls
            case.client_submitted = True
        else:
            if case.freelancer_submitted:
                raise gl.vm.UserError("Freelancer case already submitted")
            case.freelancer_statement = statement
            case.freelancer_evidence = evidence_urls
            case.freelancer_submitted = True

        self.dispute_cases[key] = case
        # The dispute is only "open" once BOTH sides have committed a case —
        # a one-sided submission must not leave a stuck flag (e.g. if the
        # freelancer later verifies and pays out, no orphaned dispute state).
        escrow.dispute_open = case.client_submitted and case.freelancer_submitted
        self.escrows[escrow_id] = escrow
        self._log_event("dispute_case_submitted", escrow_id,
                        f"Dispute case #{escrow_id}/{milestone_index} submitted")

    @gl.public.view
    def get_dispute_case(self, escrow_id: int, milestone_index: int) -> DisputeCase:
        key = f"{escrow_id}_{milestone_index}"
        return self.dispute_cases.get(key, DisputeCase(
            client_statement="", client_evidence=[], client_submitted=False,
            freelancer_statement="", freelancer_evidence=[], freelancer_submitted=False,
        ))

    @gl.public.write
    def resolve_dispute(
        self,
        escrow_id: int,
        milestone_index: int,
    ) -> str:
        """Resolve a dispute using both parties' committed cases. Validators
        must agree on the verdict CATEGORY (client / freelancer / split). A
        freelancer-win ruling pays the freelancer ATOMICALLY in this same tx —
        exactly like client-win (refund) and split (pay both) already do. Since
        the paid-out milestone becomes terminal, no separate release is possible
        on a dispute-settled milestone."""
        escrow = self.escrows[escrow_id]
        if escrow.status == "completed":
            raise gl.vm.UserError("Escrow already completed")

        sender = gl.message.sender_address
        if sender != escrow.client and sender != escrow.freelancer:
            raise gl.vm.UserError("Only escrow parties can open a dispute")

        idx = int(milestone_index)
        if idx < 0 or idx >= len(escrow.milestones):
            raise gl.vm.UserError("Invalid milestone index")

        ms = escrow.milestones[idx]
        if ms.status in ("paid", "refunded", "split"):
            raise gl.vm.UserError("Milestone already settled")
        if ms.status == "verified":
            raise gl.vm.UserError("Milestone already verified — release payment instead")

        key = f"{escrow_id}_{milestone_index}"
        case = self.dispute_cases.get(key, DisputeCase(
            client_statement="", client_evidence=[], client_submitted=False,
            freelancer_statement="", freelancer_evidence=[], freelancer_submitted=False,
        ))
        # Both parties must have submitted their own case; a dispute is only
        # adjudicated once each side's true position is committed on-chain.
        if not (case.client_submitted and case.freelancer_submitted):
            raise gl.vm.UserError("Both parties must submit a case first")
        if key in self.dispute_by_milestone:
            existing = self.disputes[self.dispute_by_milestone[key]]
            if existing.resolved:
                raise gl.vm.UserError("Dispute already resolved for this milestone")

        dispute_id = self.dispute_counter
        self.dispute_counter = self.dispute_counter + u256(1)

        escrow.dispute_open = True

        work_ev_list = [str(u) for u in ms.evidence_urls]
        work_title = str(ms.title)
        client_statement = case.client_statement
        client_evidence = case.client_evidence
        freelancer_statement = case.freelancer_statement
        freelancer_evidence = case.freelancer_evidence

        # Flatten storage-backed DynArrays to plain lists BEFORE the nondet
        # closures: leader/validator functions get pickled for the validators,
        # and the runtime does not support reading storage inside nondet mode.
        client_ev_list = [str(u) for u in client_evidence]
        freelancer_ev_list = [str(u) for u in freelancer_evidence]

        def fetch_evidence(urls) -> str:
            out = ""
            for u in urls:
                out += f"\n  - {u}"
                try:
                    content = gl.nondet.web.render(u, mode="text")
                    out += f"\n    Content: {content[:1000]}"
                except Exception:
                    out += "\n    (Could not fetch)"
            return out

        def classify(share: int) -> str:
            if share >= 67:
                return "client"
            if share <= 33:
                return "freelancer"
            return "split"

        def parse_share(res) -> int:
            raw = res.get("client_share", 50)
            try:
                return max(0, min(100, int(raw)))
            except (TypeError, ValueError):
                try:
                    return max(0, min(100, int(float(raw))))
                except (TypeError, ValueError):
                    return 50

        def leader_fn() -> dict:
            work_section = "WORK CONTENT: none"
            if work_ev_list:
                work_section = "WORK CONTENT:" + fetch_evidence(work_ev_list)
            client_ev = fetch_evidence(client_ev_list)
            freelancer_ev = fetch_evidence(freelancer_ev_list)
            prompt = f"""
You are an AI dispute resolver for Praetor escrow platform.
The freelancer submitted work for a milestone and it was evaluated. One party disagrees with the result.

MILESTONE: {work_title}
FREELANCER'S SUBMITTED WORK (evidence URLs): {', '.join(work_ev_list)}
{work_section}

CLIENT'S STATEMENT: {client_statement}
CLIENT'S EVIDENCE:{client_ev}

FREELANCER'S STATEMENT: {freelancer_statement}
FREELANCER'S EVIDENCE:{freelancer_ev}

Evaluate the submitted work and both arguments. Decide how the milestone funds should be split.
Respond ONLY as JSON:
{{"client_share": int 0-100, "verdict": "client"|"freelancer"|"split", "reasoning": "string"}}
- client_share is the percentage of the milestone amount that should go to the CLIENT.
- 100 = fully the client's money (freelancer gets nothing, refund) — verdict "client".
- 0 = fully the freelancer's money (milestone verified, client pays) — verdict "freelancer".
- ~50 = split evenly — verdict "split".
- verdict MUST be consistent with client_share: client>=67, freelancer<=33, split 34-66.
"""
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(res, dict):
                raise gl.vm.UserError("Invalid response")
            share = parse_share(res)
            return {
                "client_share": share,
                "verdict": classify(share),
                "reasoning": str(res.get("reasoning", "")),
            }

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict) or "client_share" not in data:
                return False
            share = data.get("client_share")
            if not isinstance(share, int) or not (0 <= share <= 100):
                return False
            my = leader_fn()
            if not isinstance(my, dict) or "client_share" not in my:
                return False
            # Validators must agree on the ACTUAL verdict category, not just a
            # close numeric share (e.g. 32 vs 40 are within 20 but NOT the same
            # ruling: freelancer vs split).
            if classify(my["client_share"]) != classify(share):
                return False
            return abs(my["client_share"] - share) <= 20

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        verdict = classify(int(result["client_share"]))
        reasoning = str(result["reasoning"])

        self.disputes[dispute_id] = Dispute(
            escrow_id=escrow_id,
            milestone_index=milestone_index,
            client_statement=DisputeStatement(
                party_address=escrow.client,
                statement=client_statement,
                evidence_urls=client_evidence,
            ),
            freelancer_statement=DisputeStatement(
                party_address=escrow.freelancer,
                statement=freelancer_statement,
                evidence_urls=freelancer_evidence,
            ),
            verdict=verdict,
            resolved=True,
            reasoning=reasoning,
        )
        self.dispute_by_milestone[key] = dispute_id
        self._log_event("dispute_opened", escrow_id, f"Dispute #{dispute_id} opened")

        ms = escrow.milestones[idx]
        amount = int(ms.amount)

        if verdict == "freelancer":
            pct = int(self.platform_fee_percent)
            fee = (amount * pct) // 100
            payout = int(amount - fee)
            _EOA(escrow.freelancer).emit_transfer(value=u256(payout))
            ms.status = "paid"
            ms.verified = True
            escrow.winner = escrow.freelancer
            self._log_event("dispute_resolved", escrow_id,
                            f"Dispute #{dispute_id}: freelancer wins — paid {payout} wei (fee {fee})")
            self._record_dispute_result(str(escrow.freelancer), True)
            self._record_dispute_result(str(escrow.client), False)
            # Dispute-settled payout is a real completed job.
            self._record_job_completed(str(escrow.client), "client", amount)
            self._record_job_completed(str(escrow.freelancer), "freelancer", payout)
            all_paid = True
            for m in escrow.milestones:
                if m.status != "paid":
                    all_paid = False
                    break
            if all_paid:
                escrow.status = "completed"
                job = self.job_postings[escrow.job_id]
                job.status = "completed"
                self.job_postings[escrow.job_id] = job
        elif verdict == "client":
            _EOA(escrow.client).emit_transfer(value=u256(amount))
            ms.status = "refunded"
            escrow.winner = escrow.client
            self._log_event("dispute_resolved", escrow_id,
                            f"Dispute #{dispute_id}: client wins — refunded {amount} wei")
            self._record_dispute_result(str(escrow.client), True)
            self._record_dispute_result(str(escrow.freelancer), False)
        else:  # split
            pct = int(self.platform_fee_percent)
            fee = (amount * pct) // 100
            payout = int(amount - fee)
            half = payout // 2
            remainder = payout - half
            _EOA(escrow.client).emit_transfer(value=u256(half))
            _EOA(escrow.freelancer).emit_transfer(value=u256(remainder))
            ms.status = "split"
            escrow.winner = Address("0x0000000000000000000000000000000000000000")
            self._log_event("dispute_resolved", escrow_id,
                            f"Dispute #{dispute_id}: split — fee {fee}, client {half}, freelancer {remainder}")
            self._record_dispute_result(str(escrow.client), True)
            self._record_dispute_result(str(escrow.freelancer), True)

        escrow.milestones[idx] = ms
        escrow.dispute_open = False
        self.escrows[escrow_id] = escrow
        self._log_event("dispute_resolved", escrow_id, f"Verdict: {verdict}")
        return verdict

    @gl.public.view
    def get_dispute(self, dispute_id: int) -> Dispute:
        return self.disputes[dispute_id]

    @gl.public.view
    def get_dispute_counter(self) -> int:
        return self.dispute_counter

    @gl.public.view
    def get_dispute_by_escrow_milestone(self, escrow_id: int, milestone_index: int) -> int:
        key = f"{escrow_id}_{milestone_index}"
        if key not in self.dispute_by_milestone:
            return u256(2**256 - 1)
        return self.dispute_by_milestone[key]

    def _record_dispute_result(self, user_address: str, won: bool):
        user = Address(user_address)
        if user in self.profiles:
            p = self.profiles[user]
            p.disputed_jobs = p.disputed_jobs + u256(1)
            if won:
                p.won_disputes = p.won_disputes + u256(1)
            p.praetor_score = self._calc_score(p)
            self.profiles[user] = p

    # ── Reputation Methods ──────────────────────────────────────────────────

    @gl.public.write
    def register_user(self, display_name: str, role: str):
        sender = gl.message.sender_address
        if sender in self.profiles:
            raise gl.vm.UserError("Already registered")
        self.profiles[sender] = ReputationProfile(
            display_name=display_name,
            total_jobs=u256(0),
            completed_jobs=u256(0),
            disputed_jobs=u256(0),
            won_disputes=u256(0),
            total_earned=u256(0),
            total_spent=u256(0),
            praetor_score=u256(50),
            role=role,
        )

    def _record_job_completed(self, user_address: str, role: str, amount: int):
        """Internal-only: update reputation from a real, authenticated on-chain
        event (emitted by release_payment). Never callable externally so no
        outsider can forge anyone's score/earnings."""
        user = Address(user_address)
        if user not in self.profiles:
            return
        p = self.profiles[user]
        p.total_jobs = p.total_jobs + u256(1)
        p.completed_jobs = p.completed_jobs + u256(1)
        amt = int(amount)
        if role == "freelancer":
            p.total_earned = p.total_earned + amt
        else:
            p.total_spent = p.total_spent + amt
        p.praetor_score = self._calc_score(p)
        self.profiles[user] = p

    @gl.public.view
    def get_praetor_score(self, user_address: str) -> int:
        user = Address(user_address)
        if user not in self.profiles:
            return u256(0)
        return self.profiles[user].praetor_score

    @gl.public.view
    def get_profile(self, user_address: str) -> ReputationProfile:
        return self.profiles[Address(user_address)]

    def _calc_score(self, p: ReputationProfile) -> int:
        if p.total_jobs == u256(0):
            return u256(50)
        completion = (int(p.completed_jobs) * 100) // int(p.total_jobs)
        score = 50 + (completion // 2)
        if p.disputed_jobs > u256(0):
            wins = (int(p.won_disputes) * 100) // int(p.disputed_jobs)
            score = score + (wins // 4)
        return score if score <= 100 else 100

    # ── Audit Trail Methods ─────────────────────────────────────────────────

    @gl.public.view
    def get_event(self, event_id: int) -> AuditEvent:
        return self.audit_events[event_id]

    @gl.public.view
    def get_escrow_events(self, escrow_id: int) -> DynArray[AuditEvent]:
        if escrow_id not in self.escrow_event_index:
            return []
        result: DynArray[AuditEvent] = []
        for eid in self.escrow_event_index[escrow_id]:
            result.append(self.audit_events[eid])
        return result

    @gl.public.view
    def get_total_events(self) -> int:
        return self.event_counter

    def _log_event(self, event_type: str, entity_id: int, description: str):
        eid = self.event_counter
        self.event_counter = self.event_counter + u256(1)
        self.audit_events[eid] = AuditEvent(
            event_id=eid,
            event_type=event_type,
            escrow_id=entity_id,
            actor=gl.message.sender_address,
            description=description,
            metadata="",
        )
        if entity_id in self.escrow_event_index:
            self.escrow_event_index[entity_id].append(eid)
        else:
            self.escrow_event_index[entity_id] = [eid]
