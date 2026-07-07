# Praetor — AI-Powered Escrow Marketplace on GenLayer

> *Sicut praetor Romanus, ita contractus intelligens: iustus, verificabilis, immutabilis.*  
> *(As the Roman praetor, so the intelligent contract: just, verifiable, immutable.)*

**Praetor** is a decentralized escrow marketplace where **AI validators** — not humans — verify work and resolve disputes. Built on GenLayer's Intelligent Contracts, every milestone is checked by multiple LLM validators running inside the consensus protocol itself.

No more he-said-she-said. No more escrow agents taking weeks. The code judges.

---

## Use Cases

### 🏗️ Freelance Development
A client posts a job ("Build a DeFi dashboard") with milestones and locked funds. A freelancer applies, gets assigned, and submits evidence for each milestone (GitHub PR, deployment URL, test results). GenLayer validators independently review the evidence via LLM consensus. If the work passes, funds are released automatically.

### 🔐 Smart Contract Audits
An auditor completes a security review and submits the report as evidence. The AI verifies the report covers the agreed scope before payment is released. If the client disputes the audit quality, both parties submit statements and an AI jury decides the verdict.

### 🎨 Creative & Design Work
A designer delivers mockups, Figma links, or assets. The AI checks whether the deliverables match the milestone description — resolution, format, file count, visual consistency — and approves or rejects accordingly.

### 📝 Content & Translation
Writers submit published articles or translation proofs. The AI validates word count, topic relevance, and formatting requirements against the milestone criteria before signaling completion.

### ⚖️ Dispute Resolution
When a milestone is rejected, either party can open a dispute. Both submit statements and evidence. Five GenLayer validators act as jurors, each casting an independent AI-reasoned vote. A final AI consensus aggregates the votes into a binding verdict — **client wins**, **freelancer wins**, or **split**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (UI)                       │
│  TanStack Start · React 19 · Tailwind · shadcn/ui       │
│  EIP-6963 Wallet (MetaMask + GenLayer Snap)             │
└────────────────────────┬────────────────────────────────┘
                         │ writeContract / readContract
                         ▼
┌─────────────────────────────────────────────────────────┐
│              GenLayer Bradbury Network                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           PraetorV2 Intelligent Contract         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │   │
│  │  │Marketplace│  │  Escrow  │  │   AI Verify   │  │   │
│  │  │ post/apply│  │  release │  │ LLM consensus │  │   │
│  │  │ assign    │  │  dispute │  │  jury (5)     │  │   │
│  │  └──────────┘  └──────────┘  └───────────────┘  │   │
│  │  ┌──────────────┐  ┌────────────────────────┐    │   │
│  │  │  Reputation  │  │     Audit Trail        │    │   │
│  │  │  on-chain    │  │  every event logged    │    │   │
│  │  └──────────────┘  └────────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **AI verifies, not humans** | Every milestone is checked by GenLayer's `gl.nondet.exec_prompt` across multiple validators. No middlemen, no delays, no bias. |
| **Funds locked at post time** | The client deposits the full milestone amount when posting. The contract holds it until AI verification or dispute resolution. |
| **5-jury AI dispute** | Disputes are resolved by 5 independent LLM validators. The AI leader proposes a verdict; validators must agree within tolerance. |
| **Rate-limited reads** | Bradbury RPC has strict rate limits. All contract reads go through a global queue (200ms spacing, 3 retries) + localStorage cache (30s TTL). |
| **Progressive loading** | Marketplace shows job IDs immediately (1 call), loads details in background. UI is never blocked. |

---

## Smart Contract

Written in Python using `py-genlayer`. Deployed at **`0x75E095CC5820e989Ffa3E17bF7cF6db3ea593980`**.

### View Functions

| Function | Returns |
|---|---|
| `get_open_jobs()` | IDs of all open job postings |
| `get_job(id)` | Full job data (title, milestones, budget, status, applicants) |
| `get_applicants(id)` | Addresses of applicants for a job |
| `get_client_jobs(addr)` | All job IDs for a client |
| `get_freelancer_jobs(addr)` | All job IDs for a freelancer |
| `get_escrow(id)` | Full escrow data (milestones, status, parties) |
| `get_escrow_status(id)` | Current status string |
| `get_verification(escrowId, milestoneIdx)` | AI verification result (passed, score, reasoning) |
| `is_verified(escrowId, milestoneIdx)` | Boolean pass/fail |
| `get_praetor_score(addr)` | On-chain reputation score (0–100) |
| `get_dispute(id)` | Full dispute data |
| `get_event(id)` | Audit event |
| `get_escrow_events(escrowId)` | All audit events for an escrow |

### Write Functions

| Function | Description |
|---|---|
| `post_job(...)` | Create job posting with milestones, send budget |
| `apply_job(jobId)` | Apply as freelancer |
| `assign_freelancer(jobId, addr)` | Assign freelancer, creates escrow, locks funds |
| `submit_evidence(escrowId, milestoneIdx, url)` | Freelancer submits proof of work |
| `verify_milestone(...)` | Trigger AI verification (evidence → LLM consensus → score) |
| `release_payment(escrowId, milestoneIdx)` | Client releases milestone payment |
| `open_dispute(...)` | Either party opens a dispute with statements + evidence |
| `cast_juror_vote(disputeId, vote, reasoning)` | Juror votes (client/freelancer/split) |
| `resolve_dispute(disputeId)` | AI aggregates juror votes into final verdict |

### AI Verification Flow

```
1. Freelancer calls verify_milestone(escrowId, milestoneIdx, evidence[])
2. Contract builds a prompt: job description + milestone details + evidence list
3. gl.nondet.exec_prompt (leader) → {"passed": bool, "score": int, "reasoning": str}
4. gl.vm.run_nondet_unsafe:
   - Leader generates result
   - Validator checks: abs(my_score - leader_score) <= 15
5. If consensus → milestone marked verified/rejected, result stored on-chain
```

---

## Features

| Tab | What it does |
|---|---|
| **Marketplace** | Browse all open jobs. Apply as freelancer. Post a new job (budget locked immediately). Random fill for quick testing. |
| **Dashboard** | Role toggle (client/freelancer). See your jobs, escrows, applicants, milestones. Assign freelancer directly. |
| **AI Verify** | Pick an escrow + milestone. Attach evidence (URLs, types). See AI consensus step-by-step: leader proposes → validators check → result rendered. |
| **Release** | Select escrow + milestone. Client releases payment after verification passes. |
| **Dispute** | Enter escrow + both party statements. "Convene the jury" sends a transaction. On-chain, AI jurors vote and resolve. |
| **History** | Completed jobs grouped by role. Milestone breakdown, escrow status, verification results. |
| **Reputation** | Look up any wallet's on-chain Praetor score and completed job count. |

---

## Getting Started

```bash
bun install
bun run dev          # → http://localhost:8080
bun run build        # Production build → .output/
```

### Prerequisites
- [MetaMask](https://metamask.io/) with GenLayer Snap installed (auto-prompted on first write)
- A wallet funded with GEN on Bradbury (use [faucet](https://faucet-bradbury.genlayer.com))
- Contract already deployed at `0x75E095CC5820e989Ffa3E17bF7cF6db3ea593980`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Smart Contract | Python (`py-genlayer`) |
| GenLayer SDK | `genlayer-js` v1.2.0 |
| Wallet Discovery | EIP-6963 |
| RPC | `https://rpc-bradbury.genlayer.com` |
| Chain ID | `4221` (`0x107d`) |

---

## Project Structure

```
src/
├── lib/
│   ├── genlayer-client.ts      # Full contract wrapper (read/write, cache, rate limiter)
│   ├── genlayer-network.ts     # Network config, chain constants, contract address
│   └── wallet.tsx              # EIP-6963 multi-wallet provider
├── routes/
│   ├── features.tsx            # All 7 tabs in one file (~1400 lines)
│   └── index.tsx               # Landing page with hero + feature cards
├── components/
│   ├── RomanCandle.tsx         # Candle melt animation for transaction feedback
│   └── ui/                     # ~40 shadcn/ui primitives
├── styles.css                  # Verdigris & Ivory theme
├── router.tsx
├── routeTree.gen.ts
└── contracts/
    └── praetor.py              # PraetorV2 — 697 lines of GenLayer Python
```

---

## License

MIT — use it, fork it, ship it.
