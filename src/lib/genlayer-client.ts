import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { CONTRACTS, FAUCET_URL } from "./genlayer-network";

const PRAETOR_ADDRESS = CONTRACTS.praetor;

let writeClientCache: {
  address: string;
  providerId: string;
  client: ReturnType<typeof createClient>;
} | null = null;

export function getWriteClient(walletAddress: string, provider: any) {
  if (
    writeClientCache?.address === walletAddress &&
    writeClientCache?.providerId === provider?.rdns
  )
    return writeClientCache.client;

  const client = createClient({
    chain: testnetBradbury,
    account: walletAddress as `0x${string}`,
    provider,
  });

  writeClientCache = { address: walletAddress, providerId: provider?.rdns, client };
  return client;
}

export const readClient = createClient({
  chain: testnetBradbury,
});

// ─── Global rate limiter (one call at a time, 200ms interval) ───────────
let lastCall = 0;
let queue: (() => Promise<void>)[] = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const elapsed = Date.now() - lastCall;
    if (elapsed < 200) await new Promise((r) => setTimeout(r, 200 - elapsed));
    const task = queue.shift()!;
    try { await task(); } catch { /* pass */ }
    lastCall = Date.now();
  }
  processing = false;
}

async function throttledContractCall<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise<T>((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (e: any) {
            reject(e);
          }
        });
        processQueue();
      });
    } catch (e: any) {
      const msg = e?.message || e?.cause || "";
      if (msg.includes("rate limit") && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("rate limit exceeded after retries");
}

// ─── LocalStorage cache (30s TTL) ───────────────────────────────────────
const CACHE_PREFIX = "praetor:";
const CACHE_TTL = 30_000;

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

export function invalidateMarketplaceCache(): void { localStorage.removeItem(CACHE_PREFIX + "marketplace"); }

export function resetWriteClient() {
  writeClientCache = null;
}

// ─── Network ────────────────────────────────────────────────────────────────

export async function switchToBradbury(provider: {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}): Promise<boolean> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x107d" }],
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
              chainId: "0x107d",
              chainName: "GenLayer Bradbury",
              rpcUrls: ["https://rpc-bradbury.genlayer.com"],
              nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
              blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
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
  provider: any,
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
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
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
  provider: any,
  jobId: bigint,
): Promise<string> {
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "apply_job",
    args: [jobId],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function assignFreelancer(
  walletAddress: string,
  provider: any,
  jobId: bigint,
  freelancerAddress: string,
): Promise<string> {
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
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
  provider: any,
  escrowId: bigint,
  milestoneIndex: bigint,
  evidenceUrl: string,
): Promise<string> {
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "submit_evidence",
    args: [escrowId, milestoneIndex, evidenceUrl],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function releasePayment(
  walletAddress: string,
  provider: any,
  escrowId: bigint,
  milestoneIndex: bigint,
): Promise<string> {
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "release_payment",
    args: [escrowId, milestoneIndex],
    value: BigInt(0),
  });
  return txHash as string;
}

export async function verifyMilestone(
  walletAddress: string,
  provider: any,
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
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
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
  provider: any,
  escrowId: bigint,
  milestoneIndex: bigint,
  clientStatement: string,
  clientEvidence: string[],
  freelancerStatement: string,
  freelancerEvidence: string[],
): Promise<string> {
  const client = getWriteClient(walletAddress, provider);
  const txHash = await client.writeContract({
    address: PRAETOR_ADDRESS,
    functionName: "open_dispute",
    args: [escrowId, milestoneIndex, clientStatement, clientEvidence, freelancerStatement, freelancerEvidence],
    value: BigInt(0),
  });
  return txHash as string;
}

// ─── Marketplace Read ───────────────────────────────────────────────────────

export async function getOpenJobs(): Promise<bigint[]> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_open_jobs",
      args: [],
    }),
  );
  return (result as bigint[]) || [];
}

export async function getJob(jobId: bigint): Promise<any> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_job",
      args: [jobId],
    }),
  );
  return result;
}

export async function getApplicants(jobId: bigint): Promise<string[]> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_applicants",
      args: [jobId],
    }),
  );
  return (result as string[]) || [];
}

export async function getClientJobs(clientAddress: string): Promise<bigint[]> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_client_jobs",
      args: [clientAddress],
    }),
  );
  return (result as bigint[]) || [];
}

export async function getFreelancerJobs(freelancerAddress: string): Promise<bigint[]> {
  const result = await throttledContractCall(() =>
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
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_escrow_status",
      args: [escrowId],
    }),
  );
  return result as string;
}

export async function getEscrow(escrowId: bigint): Promise<any> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_escrow",
      args: [escrowId],
    }),
  );
  return result;
}

export async function getVerification(
  escrowId: bigint,
  milestoneIndex: bigint,
): Promise<{ passed: boolean; score: number; reasoning: string; evidence_count: number }> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "get_verification",
      args: [escrowId, milestoneIndex],
    }),
  );
  return result as any;
}

export async function isVerified(
  escrowId: bigint,
  milestoneIndex: bigint,
): Promise<boolean> {
  const result = await throttledContractCall(() =>
    readClient.readContract({
      address: PRAETOR_ADDRESS,
      functionName: "is_verified",
      args: [escrowId, milestoneIndex],
    }),
  );
  return result as boolean;
}

export async function getPraetorScore(walletAddress: string): Promise<bigint> {
  const result = await throttledContractCall(() =>
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
  window.open(FAUCET_URL, "_blank", "noopener");
}
