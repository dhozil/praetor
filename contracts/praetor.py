# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class Milestone:
    title: str
    description: str
    amount: u256
    evidence_types: str
    status: str
    evidence_url: str
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
class JurorVote:
    juror_address: Address
    vote: str
    reasoning: str


@allow_storage
@dataclass
class Dispute:
    escrow_id: u256
    milestone_index: u256
    client_statement: DisputeStatement
    freelancer_statement: DisputeStatement
    juror_votes: DynArray[JurorVote]
    verdict: str
    resolved: bool


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
    num_jurors: u8

    # Reputation
    profiles: TreeMap[Address, ReputationProfile]

    # Audit
    event_counter: u256
    audit_events: TreeMap[u256, AuditEvent]
    escrow_event_index: TreeMap[u256, DynArray[u256]]

    def __init__(self, platform_fee_percent: u8):
        self.job_counter = u256(0)
        self.escrow_counter = u256(0)
        self.platform_fee_percent = platform_fee_percent
        self.dispute_counter = u256(0)
        self.num_jurors = u8(5)
        self.event_counter = u256(0)

    # ── Marketplace: Job Posting ─────────────────────────────────────────────

    @gl.public.write.payable
    def post_job(
        self,
        title: str,
        description: str,
        milestone_titles: DynArray[str],
        milestone_descriptions: DynArray[str],
        milestone_amounts: DynArray[u256],
        evidence_types: DynArray[str],
        requirements: str,
    ) -> u256:
        if len(milestone_titles) == 0:
            raise gl.vm.UserError("At least one milestone required")
        if len(milestone_titles) != len(milestone_descriptions):
            raise gl.vm.UserError("Titles and descriptions must match")
        if len(milestone_titles) != len(milestone_amounts):
            raise gl.vm.UserError("Titles and amounts must match")

        total = u256(0)
        for amt in milestone_amounts:
            total = total + amt
        if gl.message.value < total:
            raise gl.vm.UserError("Insufficient funds sent")

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
    def apply_job(self, job_id: u256):
        job = self.job_postings[job_id]
        if job.status != "open":
            raise gl.vm.UserError("Job is not open")
        sender = gl.message.sender_address
        for a in job.applicants:
            if a == sender:
                raise gl.vm.UserError("Already applied")
        job.applicants.append(sender)
        self.job_postings[job_id] = job
        self._log_event("job_applied", job_id, f"Freelancer applied to job #{job_id}")

    @gl.public.write
    def assign_freelancer(self, job_id: u256, freelancer_address: str):
        job = self.job_postings[job_id]
        if job.status != "open":
            raise gl.vm.UserError("Job is not open")
        if gl.message.sender_address != job.client:
            raise gl.vm.UserError("Only client can assign")

        freelancer = Address(freelancer_address)

        # Create escrow from job
        escrow_id = self._create_escrow_from_job(job, freelancer)

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

    def _create_escrow_from_job(self, job: JobPosting, freelancer: Address) -> u256:
        escrow_id = self.escrow_counter
        self.escrow_counter = self.escrow_counter + u256(1)

        milestones: DynArray[Milestone] = []
        for i in range(len(job.milestone_titles)):
            milestones.append(Milestone(
                title=job.milestone_titles[i],
                description=job.milestone_descriptions[i],
                amount=job.milestone_amounts[i],
                evidence_types=job.evidence_types[i] if i < len(job.evidence_types) else "",
                status="pending",
                evidence_url="",
                ai_score=u8(0),
                verified=False,
            ))

        self.escrows[escrow_id] = Escrow(
            job_id=u256(0),
            job_title=job.title,
            job_description=job.description,
            client=job.client,
            freelancer=freelancer,
            budget=job.total_budget,
            milestones=milestones,
            status="active",
            created_at=u256(0),
            dispute_open=False,
        )
        return escrow_id

    # ── Marketplace: View Methods ────────────────────────────────────────────

    @gl.public.view
    def get_open_jobs(self) -> DynArray[u256]:
        return self.open_job_ids

    @gl.public.view
    def get_job(self, job_id: u256) -> JobPosting:
        return self.job_postings[job_id]

    @gl.public.view
    def get_applicants(self, job_id: u256) -> DynArray[Address]:
        return self.job_postings[job_id].applicants

    @gl.public.view
    def get_client_jobs(self, client_address: str) -> DynArray[u256]:
        addr = Address(client_address)
        if addr not in self.client_job_ids:
            return []
        return self.client_job_ids[addr]

    @gl.public.view
    def get_freelancer_jobs(self, freelancer_address: str) -> DynArray[u256]:
        addr = Address(freelancer_address)
        if addr not in self.freelancer_job_ids:
            return []
        return self.freelancer_job_ids[addr]

    @gl.public.view
    def get_job_by_escrow(self, escrow_id: u256) -> u256:
        for jid in self.job_postings:
            if self.job_postings[jid].status == "assigned":
                if jid in self.job_to_escrow and self.job_to_escrow[jid] == escrow_id:
                    return jid
        return u256(2**256 - 1)

    # ── Escrow View Methods ──────────────────────────────────────────────────

    @gl.public.view
    def get_escrow(self, escrow_id: u256) -> Escrow:
        return self.escrows[escrow_id]

    @gl.public.view
    def get_escrow_status(self, escrow_id: u256) -> str:
        return self.escrows[escrow_id].status

    # ── Escrow Write Methods ─────────────────────────────────────────────────

    @gl.public.write
    def submit_evidence(self, escrow_id: u256, milestone_index: u256, evidence_url: str):
        escrow = self.escrows[escrow_id]
        if gl.message.sender_address != escrow.freelancer:
            raise gl.vm.UserError("Only freelancer can submit evidence")
        if escrow.status != "active":
            raise gl.vm.UserError("Escrow not active")

        idx = int(milestone_index)
        ms = escrow.milestones[idx]
        ms.evidence_url = evidence_url
        ms.status = "evidence_submitted"
        escrow.milestones[idx] = ms
        self.escrows[escrow_id] = escrow
        self._log_event("evidence_submitted", escrow_id,
                        f"Milestone {milestone_index} evidence submitted")

    @gl.public.write
    def release_payment(self, escrow_id: u256, milestone_index: u256):
        escrow = self.escrows[escrow_id]
        if gl.message.sender_address != escrow.client:
            raise gl.vm.UserError("Only client can release payment")

        idx = int(milestone_index)
        ms = escrow.milestones[idx]
        if not ms.verified:
            raise gl.vm.UserError("Milestone not verified yet")

        amount = ms.amount
        fee = (amount * u256(self.platform_fee_percent)) / u256(100)
        payout = amount - fee

        ms.status = "paid"
        escrow.milestones[idx] = ms

        freelancer = gl.get_contract_at(escrow.freelancer)
        freelancer.emit_transfer(value=payout)

        all_paid = True
        for m in escrow.milestones:
            if m.status != "paid":
                all_paid = False
                break
        if all_paid:
            escrow.status = "completed"

        self.escrows[escrow_id] = escrow
        self._log_event("payment_released", escrow_id,
                        f"Paid {payout} wei to freelancer")

    # ── AI Verification ─────────────────────────────────────────────────────

    @gl.public.write
    def verify_milestone(
        self,
        escrow_id: u256,
        milestone_index: u256,
        evidence_urls: DynArray[str],
        evidence_types: DynArray[str],
        job_description: str,
        milestone_title: str,
        milestone_description: str,
    ) -> VerificationResult:
        if len(evidence_urls) == 0:
            raise gl.vm.UserError("At least one evidence required")

        escrow = self.escrows[escrow_id]
        if gl.message.sender_address != escrow.freelancer:
            raise gl.vm.UserError("Only freelancer can verify")

        evidence_list = ""
        for i in range(len(evidence_urls)):
            evidence_list += f"\n  {i+1}. {evidence_urls[i]} ({evidence_types[i]})"

        prompt = f"""
You are an AI milestone verifier for Praetor escrow platform.
Evaluate whether the evidence demonstrates milestone completion.

JOB: {job_description}
MILESTONE: {milestone_title} - {milestone_description}

EVIDENCE ({len(evidence_urls)} items):
{evidence_list}

RULES:
- If 2+ evidence items are relevant and credible, milestone PASSES
- Score 0-100 based on evidence quality
- Explain your reasoning

Respond ONLY as JSON:
{{"passed": bool, "score": int, "reasoning": "string"}}
"""

        def leader_fn():
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(res, dict):
                raise gl.UserError("Invalid LLM response")
            return {
                "passed": bool(res.get("passed", False)),
                "score": max(0, min(100, int(res.get("score", 0)))),
                "reasoning": str(res.get("reasoning", "")),
                "evidence_count": len(evidence_urls),
            }

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict) or "passed" not in data or "score" not in data:
                return False
            my = leader_fn()
            if not isinstance(my, dict):
                return False
            return abs(my["score"] - data["score"]) <= 15

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        verification = VerificationResult(
            passed=result["passed"],
            score=u8(result["score"]),
            reasoning=result["reasoning"],
            evidence_count=u8(result["evidence_count"]),
        )

        key = f"{escrow_id}_{milestone_index}"
        self.verifications[key] = verification

        idx = int(milestone_index)
        ms = escrow.milestones[idx]
        ms.verified = result["passed"]
        ms.ai_score = u8(result["score"])
        ms.status = "verified" if result["passed"] else "rejected"
        escrow.milestones[idx] = ms
        self.escrows[escrow_id] = escrow

        self._log_event("milestone_verified", escrow_id,
                        f"Milestone {milestone_index}: {'PASSED' if result['passed'] else 'FAILED'} (score: {result['score']})")
        return verification

    @gl.public.view
    def is_verified(self, escrow_id: u256, milestone_index: u256) -> bool:
        key = f"{escrow_id}_{milestone_index}"
        if key not in self.verifications:
            return False
        return self.verifications[key].passed

    @gl.public.view
    def get_verification(self, escrow_id: u256, milestone_index: u256) -> VerificationResult:
        key = f"{escrow_id}_{milestone_index}"
        if key not in self.verifications:
            return VerificationResult(passed=False, score=u8(0), reasoning="Not verified", evidence_count=u8(0))
        return self.verifications[key]

    # ── Dispute Methods ─────────────────────────────────────────────────────

    @gl.public.write
    def open_dispute(
        self,
        escrow_id: u256,
        milestone_index: u256,
        client_statement: str,
        client_evidence: DynArray[str],
        freelancer_statement: str,
        freelancer_evidence: DynArray[str],
    ) -> u256:
        dispute_id = self.dispute_counter
        self.dispute_counter = self.dispute_counter + u256(1)

        escrow = self.escrows[escrow_id]
        escrow.dispute_open = True
        escrow.status = "disputed"
        self.escrows[escrow_id] = escrow

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
            juror_votes=[],
            verdict="",
            resolved=False,
        )
        self._log_event("dispute_opened", escrow_id, f"Dispute #{dispute_id} opened")
        return dispute_id

    @gl.public.write
    def cast_juror_vote(self, dispute_id: u256, vote: str, reasoning: str):
        dispute = self.disputes[dispute_id]
        if dispute.resolved:
            raise gl.vm.UserError("Dispute already resolved")
        if vote not in ("client", "freelancer", "split"):
            raise gl.vm.UserError("Vote must be client/freelancer/split")
        dispute.juror_votes.append(JurorVote(
            juror_address=gl.message.sender_address,
            vote=vote,
            reasoning=reasoning,
        ))
        self.disputes[dispute_id] = dispute

    @gl.public.write
    def resolve_dispute(self, dispute_id: u256) -> str:
        dispute = self.disputes[dispute_id]
        if dispute.resolved:
            raise gl.vm.UserError("Already resolved")

        votes_text = ""
        for v in dispute.juror_votes:
            votes_text += f"\n  {v.vote} - {v.reasoning}"

        prompt = f"""
You are an AI dispute resolver for Praetor escrow platform.

CLIENT: {dispute.client_statement.statement}
Evidence: {dispute.client_statement.evidence_urls}

FREELANCER: {dispute.freelancer_statement.statement}
Evidence: {dispute.freelancer_statement.evidence_urls}

JUROR VOTES:{votes_text if votes_text else "  None"}

Decide fairly who should receive funds.
Respond ONLY as JSON:
{{"verdict": "client"|"freelancer"|"split", "reasoning": "string"}}
"""

        def leader_fn():
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(res, dict):
                raise gl.UserError("Invalid response")
            verdict = res.get("verdict", "split")
            if verdict not in ("client", "freelancer", "split"):
                verdict = "split"
            return {"verdict": verdict, "reasoning": str(res.get("reasoning", ""))}

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict) or "verdict" not in data:
                return False
            my = leader_fn()
            return isinstance(my, dict) and my["verdict"] == data["verdict"]

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        dispute.verdict = result["verdict"]
        dispute.resolved = True
        self.disputes[dispute_id] = dispute
        self._log_event("dispute_resolved", dispute.escrow_id, f"Verdict: {result['verdict']}")
        return result["verdict"]

    @gl.public.view
    def get_dispute(self, dispute_id: u256) -> Dispute:
        return self.disputes[dispute_id]

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

    @gl.public.write
    def record_job(self, user_address: str, role: str, amount: u256, completed: bool):
        user = Address(user_address)
        p = self.profiles[user]
        p.total_jobs = p.total_jobs + u256(1)
        if completed:
            p.completed_jobs = p.completed_jobs + u256(1)
        if role == "freelancer":
            p.total_earned = p.total_earned + amount
        else:
            p.total_spent = p.total_spent + amount
        p.praetor_score = self._calc_score(p)
        self.profiles[user] = p

    @gl.public.write
    def record_dispute_result(self, user_address: str, won: bool):
        user = Address(user_address)
        p = self.profiles[user]
        p.disputed_jobs = p.disputed_jobs + u256(1)
        if won:
            p.won_disputes = p.won_disputes + u256(1)
        p.praetor_score = self._calc_score(p)
        self.profiles[user] = p

    @gl.public.view
    def get_praetor_score(self, user_address: str) -> u256:
        user = Address(user_address)
        if user not in self.profiles:
            return u256(0)
        return self.profiles[user].praetor_score

    @gl.public.view
    def get_profile(self, user_address: str) -> ReputationProfile:
        return self.profiles[Address(user_address)]

    def _calc_score(self, p: ReputationProfile) -> u256:
        if p.total_jobs == u256(0):
            return u256(50)
        completion = (p.completed_jobs * u256(100)) / p.total_jobs
        score = u256(50) + (completion / u256(2))
        if p.disputed_jobs > u256(0):
            wins = (p.won_disputes * u256(100)) / p.disputed_jobs
            score = score + (wins / u256(4))
        return score if score <= u256(100) else u256(100)

    # ── Audit Trail Methods ─────────────────────────────────────────────────

    @gl.public.view
    def get_event(self, event_id: u256) -> AuditEvent:
        return self.audit_events[event_id]

    @gl.public.view
    def get_escrow_events(self, escrow_id: u256) -> DynArray[AuditEvent]:
        if escrow_id not in self.escrow_event_index:
            return []
        result: DynArray[AuditEvent] = []
        for eid in self.escrow_event_index[escrow_id]:
            result.append(self.audit_events[eid])
        return result

    @gl.public.view
    def get_total_events(self) -> u256:
        return self.event_counter

    def _log_event(self, event_type: str, entity_id: u256, description: str):
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
