# Praetor — AI-Powered Escrow Marketplace on GenLayer

> *Sicut praetor Romanus, ita contractus intelligens: iustus, verificabilis, immutabilis.*  
> *(As the Roman praetor, so the intelligent contract: just, verifiable, immutable.)*

**Praetor** is a decentralized escrow marketplace where **AI validators** — not humans — verify work and resolve disputes. Built on GenLayer's Intelligent Contracts, every milestone is checked by multiple LLM validators running inside the consensus protocol itself.

No more he-said-she-said. No more escrow agents taking weeks. The code judges.

---

## Use Cases

### 🏗️ Freelance Development
A client posts a job ("Build a DeFi dashboard") with milestones and locked funds. A freelancer applies, gets assigned, and submits evidence for each milestone (GitHub PR, deployment URL, test results). GenLayer validators independently review the evidence via LLM consensus. If the work passes, funds are released automatically.

### 🔐 Intelligent Contract Audits
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
│  EIP-6963 Wallet (Rabby / MetaMask + GenLayer Snap)     │
└────────────────────────┬────────────────────────────────┘
                         │ write → wallet (eth_sendTransaction)
                         │ read  → proxy (/api/rpc)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              GenLayer Studionet                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Praetor Intelligent Contract           │   │
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
| **AI verifies, not humans** | Every milestone is checked by GenLayer's `gl.nondet.exec_prompt` across multiple validators. Evidence URLs are actually fetched via `gl.nondet.web.get()` — validators read the real content. |
| **Funds locked at post time** | The client deposits the full milestone amount when posting. The contract holds it until AI verification or dispute resolution. |
| **5-jury AI dispute** | Disputes are resolved by 5 independent LLM validators. The AI leader proposes a verdict; validators must agree within tolerance. |
| **Same-origin RPC proxy** | All contract reads go through `/api/rpc` proxy (Cloudflare Pages worker) — bypasses CORS restrictions from Studio API. |
| **Per-call localStorage cache** | Read results cached for 2 minutes — reduces RPC calls, no global rate limiter. Cache invalidated on every successful write. |
| **Auto-polling** | Marketplace and Dashboard refresh every 15 seconds — cross-device updates appear automatically. |
| **Web-fetched evidence** | `verify_milestone` now uses `gl.nondet.web.get()`/`render()` to fetch actual content from GitHub, Live URL, Figma, Docs — AI evaluates the real content, not just URL strings. |

---

## Intelligent Contract

Written in Python using `py-genlayer`. Deployed on **Studionet** at **`0xFd38de70EDa759994A1e8ffe58081Ad47239602A`**.

Deploy:
```bash
genlayer deploy --contract contracts/praetor.py --rpc https://studio.genlayer.com/api --args 2
```

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
| `get_escrow_by_job(jobId)` | Escrow ID for a given job ID |
| `get_escrow_counter()` | Total escrows created |
| `get_verification(escrowId, milestoneIdx)` | AI verification result (passed, score, reasoning) |
| `is_verified(escrowId, milestoneIdx)` | Boolean pass/fail |
| `get_dispute(id)` | Full dispute data |
| `get_dispute_counter()` | Total disputes opened |
| `get_praetor_score(addr)` | On-chain reputation score (0–100) |
| `get_profile(addr)` | Full reputation profile (name, jobs, disputes, earnings) |
| `get_event(id)` | Audit event by ID |
| `get_escrow_events(escrowId)` | All audit events for an escrow |
| `get_total_events()` | Total audit events logged |

### Write Functions

| Function | Description |
|---|---|
| `post_job(...)` | Create job posting with milestones, send budget |
| `apply_job(jobId)` | Apply as freelancer |
| `assign_freelancer(jobId, addr)` | Assign freelancer, creates escrow, locks funds |
| `submit_evidence(escrowId, milestoneIdx, url)` | Freelancer submits proof of work on-chain |
| `verify_milestone(...)` | Trigger AI verification (fetch evidence content → LLM consensus → score) |
| `release_payment(escrowId, milestoneIdx)` | Client releases milestone payment (auto-records reputation) |
| `open_dispute(...)` | Either party opens a dispute with statements + evidence |
| `cast_juror_vote(disputeId, vote, reasoning)` | Juror votes (client/freelancer/split) |
| `resolve_dispute(disputeId)` | AI aggregates juror votes into final verdict |
| `execute_dispute_verdict(disputeId)` | Releases funds to winner per verdict (auto-records dispute result) |
| `register_user(displayName, role)` | Register on-chain profile for reputation tracking |
| `record_job(addr, role, amount, completed)` | Record a completed job to reputation |
| `record_dispute_result(addr, won)` | Record dispute outcome to reputation |

### AI Verification Flow

```
1. Freelancer calls verify_milestone(escrowId, milestoneIdx, evidence[], types[])
2. Leader fetches each evidence URL via gl.nondet.web.get() / render():
   - GitHub → gl.nondet.web.get()
   - Live URL / Figma / Docs → gl.nondet.web.render(mode="text")
3. Contract builds a prompt with the FETCHED content (not just URLs)
4. gl.nondet.exec_prompt (leader) → {"passed": bool, "score": int, "reasoning": str}
5. gl.vm.run_nondet_unsafe:
   - Leader generates result
   - Validators independently re-fetch URLs + re-run AI
   - Consensus if: abs(validator_score - leader_score) <= 15
6. If consensus → milestone marked verified/rejected, result stored on-chain
```

---

## Features

| Tab | What it does |
|---|---|
| **Marketplace** | Browse all open jobs. Apply as freelancer. Post a new job (budget locked immediately). Random fill for quick testing. |
| **Dashboard** | Role toggle (client/freelancer). See your jobs, escrows, applicants, milestones. Assign freelancer directly. Auto-refresh every 15s. |
| **AI Verify** | Pick an escrow + milestone. Attach evidence (GitHub, Live URL, Figma, Docs). Submit evidence on-chain. See AI consensus step-by-step: leader fetches URLs → validators verify → result. |
| **Release** | Select escrow + milestone. Client releases payment. Auto-records reputation for both parties. |
| **Dispute** | End-to-end flow: Open dispute → cast 5 juror votes → AI resolution → execute verdict (funds released on-chain, dispute result recorded). Built-in random fill examples. |
| **History** | Completed jobs grouped by role. Milestone breakdown, escrow status, verification results. |
| **Reputation** | Register profile (name + role). Auto-displays your stats on connect: score, jobs posted/worked, disputes won, earnings. Look up any wallet. |

---

## Getting Started

```bash
pnpm install
pnpm run dev          # → http://localhost:8080
pnpm run build        # Production build → dist/
```

### Prerequisites
- **Rabby Wallet** or **MetaMask** (GenLayer Snap optional for Studio)
- A wallet funded with GEN on Studionet (use faucet at [studio.genlayer.com](https://studio.genlayer.com))
- Contract deployed on Studionet at `0xFd38de70EDa759994A1e8ffe58081Ad47239602A`

### Deploy to Cloudflare Pages
```bash
npm run build
npx nitro deploy --prebuilt
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR) |
| Build | Vite 8 + Nitro |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Intelligent Contract | Python (`py-genlayer`) via GenLayer CLI |
| GenLayer SDK | `genlayer-js` v1.2.0 |
| Wallet Discovery | EIP-6963 (Rabby / MetaMask) |
| RPC | `https://studio.genlayer.com/api` (via `/api/rpc` proxy) |
| Chain ID | `61999` (`0xf22f`) |

---

## Project Structure

```
src/
├── lib/
│   ├── genlayer-client.ts      # Full contract wrapper (read/write, cache, proxy)
│   ├── genlayer-network.ts     # Network config, chain constants, contract address
│   └── wallet.tsx              # EIP-6963 multi-wallet provider
├── routes/
│   ├── features.tsx            # All 7 tabs (~1760 lines)
│   └── index.tsx               # Landing page with hero + feature cards
├── components/
│   ├── RomanCandle.tsx         # Candle melt animation for transaction feedback
│   └── ui/                     # ~40 shadcn/ui primitives
├── server.ts                   # Cloudflare Pages worker (CORS proxy + SSR)
├── styles.css                  # Verdigris & Ivory theme
├── router.tsx
├── routeTree.gen.ts
└── contracts/
    └── praetor.py              # Praetor Intelligent Contract (~780 lines)
```

---

## License

MIT — use it, fork it, ship it.
