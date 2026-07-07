# Praetor — AI Marketplace Escrow on GenLayer

> *Sicut praetor Romanus, ita contractus intelligens: iustus, verificabilis, immutabilis.*

Praetor adalah **marketplace escrow** berbasis **Intelligent Contracts** di atas **GenLayer Bradbury**. Client posting job, freelancer apply, dan LLM validator GenLayer memverifikasi milestone via AI consensus.

## Fitur

| Tab | Fungsi |
|---|---|
| **Marketplace** | Lihat open job, apply, atau posting job baru (dana langsung terkunci) |
| **Dashboard** | Lihat job/escrow sebagai client atau freelancer |
| **AI Verify** | Submit bukti kerja, GenLayer AI nilai kelulusan |
| **Release** | Client release dana per milestone setelah AI verify |
| **Dispute** | Kedua pihak kirim statement, AI jury putuskan verdict |
| **History** | Riwayat job yang sudah completed |
| **Reputation** | Skor on-chain setiap wallet |

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Smart Contract | Python (GenLayer `py-genlayer`) |
| GenLayer SDK | `genlayer-js` v1.2.0 |
| Wallet | EIP-6963 (MetaMask, Rabby, dll.) |
| RPC | `https://rpc-bradbury.genlayer.com` |
| Contract | `0x75E095CC5820e989Ffa3E17bF7cF6db3ea593980` (PraetorV2) |

## Struktur

```
src/
├── lib/
│   ├── genlayer-client.ts    # Wrapper writeContract / readContract
│   ├── genlayer-network.ts   # Network config + contract address
│   └── wallet.tsx            # EIP-6963 wallet provider
├── routes/
│   ├── features.tsx          # Semua tab (Marketplace s/d Reputation)
│   └── index.tsx             # Landing page
├── components/
│   ├── RomanCandle.tsx       # Animasi lilin
│   └── ui/                   # shadcn/ui components
├── styles.css                # Tailwind theme
├── router.tsx
└── contracts/
    └── praetor.py            # Smart contract PraetorV2
```

## Jalankan

```bash
bun install
bun run dev          # http://localhost:8080
bun run build        # Production build
```

## Lisensi

MIT
