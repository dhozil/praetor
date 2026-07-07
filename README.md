# Praetor — AI Marketplace Escrow on GenLayer

> *Sicut praetor Romanus, ita contractus intelligens: iustus, verificabilis, immutabilis.*

Praetor is an **escrow marketplace** built on **Intelligent Contracts** over **GenLayer Bradbury**. Clients post jobs, freelancers apply, and GenLayer's LLM validators verify milestones via AI consensus.

## Features

| Tab | Description |
|---|---|
| **Marketplace** | Browse open jobs, apply as freelancer, or post a new job (funds locked on-chain) |
| **Dashboard** | View your jobs/escrows as client or freelancer with real-time milestone status |
| **AI Verify** | Submit work evidence (GitHub, URL, documents). GenLayer validators run LLM to score pass/fail |
| **Release** | Client releases milestone payments to freelancer (only after AI verify passes) |
| **Dispute** | Both parties submit statements. AI jury of 5 validators decides the verdict |
| **History** | Completed jobs record with escrow details |
| **Reputation** | On-chain reputation score per wallet |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Smart Contract | Python (GenLayer `py-genlayer`) |
| GenLayer SDK | `genlayer-js` v1.2.0 |
| Wallet | EIP-6963 (MetaMask, Rabby, etc.) |
| RPC | `https://rpc-bradbury.genlayer.com` |
| Contract | `0x75E095CC5820e989Ffa3E17bF7cF6db3ea593980` (PraetorV2) |

## Structure

```
src/
├── lib/
│   ├── genlayer-client.ts    # writeContract / readContract wrapper
│   ├── genlayer-network.ts   # Network config + contract address
│   └── wallet.tsx            # EIP-6963 wallet provider
├── routes/
│   ├── features.tsx          # All tabs (Marketplace through Reputation)
│   └── index.tsx             # Landing page
├── components/
│   ├── RomanCandle.tsx       # Candle animation component
│   └── ui/                   # shadcn/ui components
├── styles.css                # Tailwind theme
├── router.tsx
└── contracts/
    └── praetor.py            # PraetorV2 smart contract
```

## Getting Started

```bash
bun install
bun run dev          # http://localhost:8080
bun run build        # Production build
```

## License

MIT
