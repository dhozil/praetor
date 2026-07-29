import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { CONTRACTS, FAUCET_URL } from "./genlayer-network";

const PRAETOR_ADDRESS = CONTRACTS.praetor;
const PROXY_RPC = "/api/rpc";

// ─── GenLayer provider ──
// eth_sendTransaction → injected wallet (Rabby/MetaMask) for signing
// Other methods → fallback to same-origin proxy (bypasses CORS)
const PROVIDER_METHODS = new Set([
  "eth_accounts",
  "eth_requestAccounts",
  "eth_sendTransaction",
  "eth_signTransaction",
  "personal_sign",
  "eth_signTypedData_v4",
]);
const genlayerProvider = {
  request: async ({ method, params }: { method: string; params?: unknown[] }) => {
    if (PROVIDER_METHODS.has(method)) {
      const wallet = typeof window !== "undefined" ? (window as any).ethereum : undefined;
      if (!wallet) throw new Error("No wallet (Rabby/MetaMask) detected — install a browser wallet to send transactions.");
      return wallet.request({ method, params });
    }
    const res = await fetch(PROXY_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    });
    const json = await res.json();
    if (json.error) {
      const err = new Error(json.error.message || "RPC error");
      (err as any).code = json.error.code;
      (err as any).data = json.error.data;
      throw err;
    }
    return json.result;
  },
};

let writeClientCache: {
  address: string;
  client: ReturnType<typeof createClient>;
} | null = null;

export function getWriteClient(walletAddress: string) {
  if (writeClientCache?.address === walletAddress) return writeClientCache.client;
  const client = createClient({
    chain: studionet,
    account: walletAddress as `0x${string}`,
    provider: genlayerProvider,
    endpoint: "/api/rpc",
  });
  writeClientCache = { address: walletAddress, client };
  return client;
}

export const readClient = createClient({
  chain: studionet,
  endpoint: "/api/rpc",
});

export function resetWriteClient() {
  writeClientCache = null;
}

// ─── LocalStorage cache (2min TTL) ─────────────────────────────────────
const CACHE_PREFIX = "praetor:";
const CACHE_TTL = 120_000;

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return data as T;
  } catch { return null; }
}

function cacheSet(key: string, data: any): void {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() })); } catch { /* storage full */ }
}

// ─── Batch marketplace read (cached) ────────────────────────────────────
export async function getOpenJobsWithDetails(): Promise<{ id: bigint; job: any; applicants: string[] }[]> {
  const cached = cacheGet<{ id: string; job: any; applicants: string[] }[]>("marketplace");
  if (cached) return cached.map((c) => ({ id: BigInt(c.id), job: c.job, applicants: c.applicants }));

  const ids = await getOpenJobs();
  const results: { id: bigint; job: any; applicants: string[] }[] = [];
  const entries = await Promise.all(ids.map(async (id) => {
    const [job, apps] = await Promise.all([getJob(id), getApplicants(id)]);
    return { id, job, applicants: apps };
  }));
  results.push(...entries);

  cacheSet("marketplace", entries.map((e) => ({ id: e.id.toString(), job: e.job, applicants: e.applicants })));
  return results;
}

export function invalidateAllCache(): void {
  const prefix = CACHE_PREFIX;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function invalidateMarketplaceCache(): void { localStorage.removeItem(CACHE_PREFIX + "marketplace"); }

// ─── Network ────────────────────────────────────────────────────────────────

export async function switchToStudio(provider: {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}): Promise<boolean> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xf22f" }],
    });
    return true;
  } catch (switchError: unknown) {
    const error = switchError as { code?: number };
    if (error.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xf22f",
              chainName: "Genlayer Studio Network",
              rpcUrls: ["https://studio.genlayer.com/api"],
              nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
              blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
            },
          ],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

// ─── Marketplace Write ──────────────────────────────────────────────────────

export async function postJob(
  walletAddress: string,
  params: {
    title: string;
    description: string;
    milestoneTitles: string[];
    milestoneDescriptions: string[];
    milestoneAmounts: bigint[];
    evidenceTypes: string[];
    requirements: string;
    value: bigint;
  },
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "post_job",
    args: [
      params.title,
      params.description,
      params.milestoneTitles,
      params.milestoneDescriptions,
      params.milestoneAmounts,
      params.evidenceTypes,
      params.requirements,
    ],
    value: params.value,
  });
  return txHash as string;
}

export async function applyJob(
  walletAddress: string,
  jobId: bigint,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "apply_job",
    args: [jobId],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function assignFreelancer(
  walletAddress: string,
  jobId: bigint,
  freelancerAddress: string,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "assign_freelancer",
    args: [jobId, freelancerAddress],
    value: BigInt(0),
  });
  return txHash as string;
}

// ─── Escrow Write ───────────────────────────────────────────────────────────

export async function submitEvidence(
  walletAddress: string,
  escrowId: bigint,
  milestoneIndex: bigint,
  evidenceUrl: string,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "submit_evidence",
    args: [escrowId, milestoneIndex, evidenceUrl],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function releasePayment(
  walletAddress: string,
  escrowId: bigint,
  milestoneIndex: bigint,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "release_payment",
    args: [escrowId, milestoneIndex],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function verifyMilestone(
  walletAddress: string,
  params: {
    escrowId: bigint;
    milestoneIndex: bigint;
    evidenceUrls: string[];
    evidenceTypes: string[];
    jobDescription: string;
    milestoneTitle: string;
    milestoneDescription: string;
  },
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "verify_milestone",
    args: [
      params.escrowId,
      params.milestoneIndex,
      params.evidenceUrls,
      params.evidenceTypes,
      params.jobDescription,
      params.milestoneTitle,
      params.milestoneDescription,
    ],
    value: BigInt(0),
  });
  return txHash as string;
}

// ─── Dispute Write ──────────────────────────────────────────────────────────

export async function openDispute(
  walletAddress: string,
  escrowId: bigint,
  milestoneIndex: bigint,
  clientStatement: string,
  clientEvidence: string[],
  freelancerStatement: string,
  freelancerEvidence: string[],
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "open_dispute",
    args: [escrowId, milestoneIndex, clientStatement, clientEvidence, freelancerStatement, freelancerEvidence],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function castJurorVote(
  walletAddress: string,
  disputeId: bigint,
  vote: string,
  reasoning: string,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "cast_juror_vote",
    args: [disputeId, vote, reasoning],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function resolveDispute(
  walletAddress: string,
  disputeId: bigint,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "resolve_dispute",
    args: [disputeId],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function executeDisputeVerdict(
  walletAddress: string,
  disputeId: bigint,
): Promise<string> {
  const txHash = await getWriteClient(walletAddress).writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "execute_dispute_verdict",
    args: [disputeId],
    value: BigInt(0),
  });
  return txHash as string;
}

// ─── Marketplace Read ───────────────────────────────────────────────────────

async function throttledContractCall<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      const msg = e?.message || e?.cause || "";
      if (msg.includes("rate limit") && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("rate limit exceeded after retries");
}

function cachedRead<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return Promise.resolve(cached);
  return throttledContractCall(fn).then((result) => {
    cacheSet(key, result);
    return result;
  });
}

export async function getOpenJobs(): Promise<bigint[]> {
  const result = await cachedRead("openJobs", () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_open_jobs",
      args: [],
    }),
  );
  return (result as bigint[]) || [];
}

export async function getJob(jobId: bigint): Promise<any> {
  const result = await cachedRead("job:" + jobId.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_job",
      args: [jobId],
    }),
  );
  return result;
}

export async function getApplicants(jobId: bigint): Promise<string[]> {
  const result = await cachedRead("applicants:" + jobId.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_applicants",
      args: [jobId],
    }),
  );
  return (result as string[]) || [];
}

export async function getClientJobs(clientAddress: string): Promise<bigint[]> {
  const result = await cachedRead("clientJobs:" + clientAddress.toLowerCase(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_client_jobs",
      args: [clientAddress],
    }),
  );
  return (result as bigint[]) || [];
}

export async function getFreelancerJobs(freelancerAddress: string): Promise<bigint[]> {
  const result = await cachedRead("freelancerJobs:" + freelancerAddress.toLowerCase(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_freelancer_jobs",
      args: [freelancerAddress],
    }),
  );
  return (result as bigint[]) || [];
}

// ─── Escrow Read ────────────────────────────────────────────────────────────

export async function getEscrowStatus(escrowId: bigint): Promise<string> {
  const result = await cachedRead("escrowStatus:" + escrowId.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_escrow_status",
      args: [escrowId],
    }),
  );
  return result as string;
}

export async function getEscrow(escrowId: bigint): Promise<any> {
  const result = await cachedRead("escrow:" + escrowId.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_escrow",
      args: [escrowId],
    }),
  );
  return result;
}

export async function getEscrowEvents(escrowId: bigint): Promise<any[]> {
  const result = await cachedRead("escrowEvents:" + escrowId.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_escrow_events",
      args: [escrowId],
    }),
  );
  return (result as any[]) || [];
}

export async function getVerification(
  escrowId: bigint,
  milestoneIndex: bigint,
): Promise<{ passed: boolean; score: number; reasoning: string; evidence_count: number }> {
  const result = await cachedRead("verification:" + escrowId.toString() + ":" + milestoneIndex.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_verification",
      args: [escrowId, milestoneIndex],
    }),
  );
  return result as any;
}

export async function getDispute(disputeId: bigint): Promise<any> {
  const result = await cachedRead("dispute:" + disputeId.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_dispute",
      args: [disputeId],
    }),
  );
  return result;
}

export async function getDisputeCounter(): Promise<bigint> {
  const result = await cachedRead("disputeCounter", () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_dispute_counter",
      args: [],
    }),
  );
  return result as bigint;
}

export async function isVerified(
  escrowId: bigint,
  milestoneIndex: bigint,
): Promise<boolean> {
  const result = await cachedRead("isVerified:" + escrowId.toString() + ":" + milestoneIndex.toString(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "is_verified",
      args: [escrowId, milestoneIndex],
    }),
  );
  return result as boolean;
}

export async function getPraetorScore(walletAddress: string): Promise<bigint> {
  const result = await cachedRead("score:" + walletAddress.toLowerCase(), () =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_praetor_score",
      args: [walletAddress],
    }),
  );
  return result as bigint;
}

// ─── Transaction Utilities ──────────────────────────────────────────────────

export async function waitForReceipt(
  txHash: string,
  status: TransactionStatus = TransactionStatus.ACCEPTED,
) {
  const receipt = await readClient.waitForTransactionReceipt({
    hash: txHash as any,
    status,
    interval: 3000,
    retries: 60,
  });
  return receipt;
}

export function openFaucet() {
  if (FAUCET_URL) window.open(FAUCET_URL, "_blank", "noopener");
}
