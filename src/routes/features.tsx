import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileSearch,
  Coins,
  Scale,
  Star,
  Lock,
  ArrowLeft,
  Github,
  Globe,
  FileText,
  Image as ImageIcon,
  Wallet,
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Inbox,
  Briefcase,
  Users,
  UserCheck,
  Eye,
  ExternalLink,
  Lightbulb,
  Binary,
  ScrollText,
} from "lucide-react";
import { RomanCandle } from "@/components/RomanCandle";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useWallet } from "@/lib/wallet";
import {
  postJob,
  applyJob,
  assignFreelancer,
  getOpenJobs,
  getJob,
  getApplicants,
  getOpenJobsWithDetails,
  invalidateMarketplaceCache,
  invalidateAllCache,
  getClientJobs,
  getFreelancerJobs,
  getEscrow,
  getEscrowByJob,
  verifyMilestone,
  getVerification,
  getDispute,
  getDisputeCounter,
  getDisputeCounterFresh,
  getDisputeFresh,
  getEscrowEvents,
  releasePayment,
  openDispute,
  castJurorVote,
  resolveDispute,
  executeDisputeVerdict,
  waitForReceipt,
  submitEvidence,
  registerUser,
  recordJob,
  recordDisputeResult,
  getProfile,
  getPraetorScore,
} from "@/lib/genlayer-client";
import shieldImg from "@/assets/gold-shield.png";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Praetor" },
      { name: "description", content: "Praetor marketplace — post jobs, find freelancers, AI-powered milestone verification." },
      { property: "og:title", content: "Praetor — The Forum" },
      { property: "og:description", content: "AI-powered escrow marketplace on GenLayer Intelligent Contracts." },
    ],
  }),
  component: FeaturesPage,
});

type FeatureKey = "marketplace" | "dashboard" | "verify" | "release" | "dispute" | "reputation" | "history";

const features: {
  key: FeatureKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "marketplace", label: "Marketplace", icon: Briefcase },
  { key: "dashboard", label: "Dashboard", icon: Users },
  { key: "verify", label: "AI Verify", icon: FileSearch },
  { key: "release", label: "Release", icon: Coins },
  { key: "dispute", label: "Dispute", icon: Scale },
  { key: "reputation", label: "Reputation", icon: Star },
  { key: "history", label: "History", icon: ScrollText },
];

function FeaturesPage() {
  const [active, setActive] = useState<FeatureKey>("marketplace");

  return (
    <div className="relative h-screen overflow-hidden flex flex-col">
      <div className="mx-auto w-full max-w-7xl px-6 pt-4 pb-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-3 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <ConnectWalletButton />
        </div>

        <div className="mt-2 flex items-end justify-between gap-4 shrink-0">
          <div>
            <div className="mb-1 text-xs uppercase tracking-[0.3em] text-gold-soft">— The Forum</div>
            <h1 className="font-display text-3xl leading-tight md:text-4xl">
              <span className="text-marble">Praetor </span>
              <span className="text-gold-gradient">marketplace</span>
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Post jobs, find freelancers, and let GenLayer AI verify milestones.
            </p>
          </div>
          <img
            src={shieldImg}
            alt=""
            width={60}
            height={60}
            className="hidden md:block drop-shadow-[0_0_30px_oklch(0.68_0.07_175/0.6)]"
          />
        </div>

        <div className="mt-3 glass-card rounded-2xl p-1.5 flex flex-wrap gap-1 shrink-0">
          {features.map((f) => {
            const isActive = active === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={`flex-1 min-w-[100px] rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "btn-gold text-primary-foreground"
                    : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                }`}
              >
                <f.icon className="mx-auto mb-0.5 h-3.5 w-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex-1 min-h-0">
          {active === "marketplace" && <MarketplaceDemo />}
          {active === "dashboard" && <DashboardDemo />}
          {active === "verify" && <VerifyDemo />}
          {active === "release" && <ReleaseDemo />}
          {active === "dispute" && <DisputeDemo />}
          {active === "reputation" && <ReputationDemo />}
          {active === "history" && <HistoryDemo />}
        </div>
      </div>
    </div>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

function DemoShell({
  title,
  subtitle,
  left,
  right,
}: {
  title: string;
  subtitle: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px] h-full">
      <div className="glass-card rounded-2xl p-5 flex flex-col min-h-0">
        <div className="shrink-0">
          <h2 className="font-display text-xl text-marble">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto overflow-x-hidden">{left}</div>
      </div>
      <div className="glass-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center">{right}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/20 bg-black/20 p-8 text-center">
      <Inbox className="h-6 w-6 text-gold-soft" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs uppercase tracking-[0.25em] text-gold-soft">{label}</div>
      {children}
    </label>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        highlight ? "border-gold/60 bg-gold/10" : "border-gold/20 bg-white/[0.02]"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">{label}</div>
      <div className="mt-2 font-display text-3xl text-marble">{value}</div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-400",
    assigned: "bg-yellow-500/10 text-yellow-400",
    active: "bg-green-500/10 text-green-400",
    completed: "bg-gold/10 text-gold-soft",
    disputed: "bg-red-500/10 text-red-400",
    cancelled: "bg-muted/10 text-muted-foreground",
    verified: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
    paid: "bg-gold/10 text-gold-soft",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${colors[status] || "bg-muted/10 text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── Assign input component ──────────────────────────────────────────────────

function AssignFreelancerInput({ onAssign }: { onAssign: (addr: string) => Promise<void> }) {
  const [addr, setAddr] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        value={addr}
        onChange={(e) => setAddr(e.target.value)}
        className="input flex-1 font-mono text-xs"
        placeholder="0x... (wallet address)"
      />
      <button
        onClick={async () => {
          if (!addr.trim()) return;
          setLoading(true);
          try { await onAssign(addr.trim()); setAddr(""); } catch { /* */ }
          setLoading(false);
        }}
        disabled={loading || !addr.trim()}
        className="rounded-lg border border-gold/20 px-3 py-1 text-gold-soft hover:bg-gold/5 text-[11px] font-medium disabled:opacity-30"
      >
        {loading ? "…" : "Assign"}
      </button>
    </div>
  );
}

// ─── 1. Marketplace ─────────────────────────────────────────────────────────

function MarketplaceDemo() {
  const { account, connected } = useWallet();
  const [openJobIds, setOpenJobIds] = useState<bigint[]>([]);
  const [jobs, setJobs] = useState<Map<string, any>>(new Map());
  const [applicants, setApplicants] = useState<Map<string, string[]>>(new Map());
  const [showPostForm, setShowPostForm] = useState(false);

  // Post form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [msTitles, setMsTitles] = useState([""]);
  const [budget, setBudget] = useState<string>("");
  const [requirements, setRequirements] = useState("");

  // Post tx state
  const [posting, setPosting] = useState(false);
  const [applyLoading, setApplyLoading] = useState<bigint | null>(null);
  const [expandedJob, setExpandedJob] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const ids = await getOpenJobs();
      const m = new Map<string, any>();
      const a = new Map<string, string[]>();
      for (const id of ids) {
        const [job, apps] = await Promise.all([getJob(id), getApplicants(id)]);
        m.set(id.toString(), job);
        a.set(id.toString(), apps);
      }
      setOpenJobIds(ids);
      setJobs(m);
      setApplicants(a);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { const t = setInterval(refresh, 15000); return () => clearInterval(t); }, []);

  const validMs = msTitles.filter((m) => m.trim().length > 0);
  const totalBudget = parseFloat(budget) || 0;
  const canPost = title.trim() && desc.trim() && validMs.length > 0 && totalBudget > 0 && account;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      const amountWei = (() => {
        const [w, f = ""] = budget.trim().split(".");
        const frac = f.padEnd(18, "0").slice(0, 18);
        return BigInt(w || "0") * 10n ** 18n + BigInt(frac || "0");
      })();
      const perMs = amountWei / BigInt(validMs.length);
      const txHash = await postJob(account, {
        title: title.trim(),
        description: desc.trim(),
        milestoneTitles: validMs,
        milestoneDescriptions: validMs,
        milestoneAmounts: validMs.map(() => perMs),
        evidenceTypes: validMs.map(() => "GitHub"),
        requirements: requirements.trim(),
        value: amountWei,
      });
      await waitForReceipt(txHash);
      setShowPostForm(false);
      setTitle("");
      setDesc("");
      setMsTitles([""]);
      setBudget("");
      setRequirements("");
      invalidateAllCache();
      await refresh();
    } catch { /* tx failed */ }
    setPosting(false);
  };

  const handleApply = async (jobId: bigint) => {
    if (!account) return;
    setApplyLoading(jobId);
    try {
      const txHash = await applyJob(account, jobId);
      await waitForReceipt(txHash);
      invalidateAllCache();
      await refresh();
    } catch { /* failed */ }
    setApplyLoading(null);
  };

  return (
    <DemoShell
      title="Browse open jobs"
      subtitle="Find work or post a new job. Funds are locked in the contract until milestones are verified."
      left={
        <div className="space-y-3">
          {/* Post job button */}
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="btn-gold w-full rounded-full py-2.5 text-sm font-medium hover:[&]:btn-gold-hover inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showPostForm ? "Cancel" : "Post a new job"}
          </button>

          {/* Post form */}
          {showPostForm && (
            <div className="rounded-xl border border-gold/20 p-4 space-y-3">
              <Field label="Job title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Build a DeFi dashboard" />
              </Field>
              <Field label="Description">
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="input resize-none" rows={2} placeholder="Describe the work needed" />
              </Field>
              <Field label="Total budget (GEN)">
                <input type="number" min="0" step="any" value={budget} onChange={(e) => { const v = e.target.value; if (v === "" || parseFloat(v) >= 0) setBudget(v === "" ? "" : v); }} className="input" placeholder="e.g. 0.5" />
              </Field>
              <button
                onClick={() => {
                  const examples = [
                    { title: "Build a DeFi Dashboard", milestones: ["Design UI/UX mockups", "Implement wallet connect", "Build price chart module", "Deploy to mainnet"] },
                    { title: "Smart Contract Audit", milestones: ["Review ERC-20 logic", "Check reentrancy guards", "Gas optimization report", "Final security summary"] },
                    { title: "NFT Marketplace MVP", milestones: ["Set up IPFS storage", "Build minting page", "Create listing & bidding", "Test with 100 NFTs"] },
                    { title: "AI Chatbot Integration", milestones: ["Design conversation flow", "Integrate LLM API", "Add memory & context", "Deploy to production"] },
                    { title: "Token Launch Website", milestones: ["Design landing page", "Build token claim UI", "Add analytics dashboard", "Deploy & test"] },
                    { title: "DAO Governance dApp", milestones: ["Design voting UI", "Implement proposal system", "Add delegation logic", "Test governance flow"] },
                    { title: "Cross-chain Bridge UI", milestones: ["Design bridge interface", "Build deposit flow", "Implement withdrawal", "Add transaction history"] },
                    { title: "Web3 Auth & Profile", milestones: ["Design auth flow", "Implement SIWE login", "Build profile page", "Add avatar NFT support"] },
                  ];
                  const pick = examples[Math.floor(Math.random() * examples.length)];
                  const msCount = pick.milestones.length;
                  const perMs = Math.round((Math.random() * 0.2 + 0.05) * 100) / 100;
                  const total = Math.round(perMs * msCount * 100) / 100;
                  setTitle(pick.title);
                  setDesc(pick.title);
                  setMsTitles(pick.milestones);
                  setBudget(total.toString());
                }}
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gold/20 px-3 py-1.5 text-xs text-gold-soft hover:bg-gold/5 hover:text-foreground transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" /> Random fill example
              </button>
              <Field label="Milestones">
                <div className="space-y-1.5">
                  {msTitles.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/5 font-display text-xs text-gold-gradient">{i + 1}</span>
                      <input value={m} onChange={(e) => { const c = [...msTitles]; c[i] = e.target.value; setMsTitles(c); }} className="input flex-1" placeholder="Milestone title" />
                      <button onClick={() => setMsTitles((m) => m.filter((_, idx) => idx !== i))} disabled={msTitles.length === 1} className="rounded-lg border border-gold/20 px-2 text-muted-foreground hover:text-foreground disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setMsTitles((m) => [...m, ""])} className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-foreground"><Plus className="h-3.5 w-3.5" /> Add milestone</button>
                </div>
              </Field>
              <Field label="Requirements (optional)">
                <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} className="input resize-none" rows={2} placeholder="e.g. Must have 3+ years React experience" />
              </Field>
              {!connected && <div className="rounded-lg border border-gold/20 bg-gold/5 p-2 text-xs text-gold-soft text-center">Connect wallet to post a job</div>}
              <button onClick={handlePost} disabled={!canPost || posting} className="btn-gold w-full rounded-full py-2.5 text-sm font-medium hover:[&]:btn-gold-hover disabled:opacity-50 disabled:cursor-not-allowed">
                {posting ? "Posting…" : `Post job & lock ${totalBudget.toLocaleString()} GEN`}
              </button>
            </div>
          )}

          {/* Refresh */}
          <button onClick={refresh} className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-foreground">
            <ExternalLink className="h-3 w-3" /> Refresh jobs
          </button>

          {/* Open jobs list */}
          {loading ? (
            <EmptyState text="Loading jobs..." />
          ) : openJobIds.length === 0 ? (
            <EmptyState text="No open jobs yet. Post one or check back later." />
          ) : (
            <div className="grid gap-3">
              {openJobIds.map((id) => {
                const job = jobs.get(id.toString());
                const apps = applicants.get(id.toString()) || [];
                const isClient = job?.client?.toLowerCase() === account?.toLowerCase();
                const alreadyApplied = apps.some((a: string) => a.toLowerCase() === account?.toLowerCase());
                const isExpanded = expandedJob === id;

                if (!job) return null;

                return (
                  <div
                    key={id.toString()}
                    className={`rounded-xl border transition-all ${
                      isExpanded ? "border-gold/50 bg-gold/[0.04]" : "border-gold/15 bg-black/20 hover:border-gold/30 hover:bg-gold/[0.02]"
                    }`}
                  >
                    {/* Card header — always visible */}
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : id)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] text-gold-soft/60 bg-gold/5 px-1.5 py-0.5 rounded">#{id.toString()}</span>
                            <h3 className="font-display text-lg text-marble truncate">{job.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display text-xl text-gold-gradient">{Number(job.total_budget) / 1e18} <span className="text-xs">GEN</span></div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{job.milestone_titles?.length || 0} milestones</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          <span className="font-mono">{job.client.slice(0, 6)}…{job.client.slice(-4)}</span>
                        </div>
                        {job.requirements && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>Has requirements</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{apps.length} applicant{apps.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </button>

                    {/* Card actions row */}
                    <div className="px-4 pb-4 flex items-center gap-2">
                      {!isClient && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApply(id); }}
                          disabled={applyLoading === id || alreadyApplied}
                          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                            alreadyApplied
                              ? "border border-green-500/30 bg-green-500/10 text-green-400"
                              : "btn-gold hover:[&]:btn-gold-hover"
                          } disabled:opacity-50`}
                        >
                          {applyLoading === id ? "Applying…" : alreadyApplied ? "✓ Applied" : "Apply for this job"}
                        </button>
                      )}
                      {isClient && apps.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedJob(isExpanded ? null : id); }}
                          className="flex-1 rounded-lg border border-gold/20 py-2 text-xs font-medium text-gold-soft hover:bg-gold/5"
                        >
                          View {apps.length} applicant{apps.length !== 1 ? "s" : ""}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedJob(isExpanded ? null : id); }}
                        className="rounded-lg border border-gold/20 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-gold/5"
                      >
                        {isExpanded ? "Less" : "Details"}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gold/10 pt-3 space-y-3 text-xs">
                        {/* Milestones */}
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-2">Milestones</div>
                          <div className="space-y-1.5">
                            {job.milestone_titles?.map((ms: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[10px] font-mono text-gold-soft">{i + 1}</span>
                                <span className="flex-1 text-marble">{ms}</span>
                                <span className="text-gold-soft font-mono">{Number(job.milestone_amounts?.[i] || 0n) / 1e18} GEN</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Requirements */}
                        {job.requirements && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-1">Requirements</div>
                            <p className="text-muted-foreground bg-black/20 rounded-lg px-3 py-2">{job.requirements}</p>
                          </div>
                        )}

                        {/* Applicants + assign (client view) */}
                        {isClient && (
                          <div>
                            {apps.length > 0 && (
                              <div className="mb-2">
                                <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-2">Applicants ({apps.length})</div>
                                <div className="space-y-1.5">
                                  {apps.map((a: string) => (
                                    <div key={a} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2 font-mono text-marble">
                                        <UserCheck className="h-3.5 w-3.5 text-gold-soft" />
                                        <span>{a.slice(0, 8)}…{a.slice(-6)}</span>
                                      </div>
                                      <button
                                        onClick={async () => { const h = await assignFreelancer(account!, id, a); await waitForReceipt(h); invalidateAllCache(); await refresh(); }}
                                        className="rounded-lg border border-gold/20 px-3 py-1 text-gold-soft hover:bg-gold/5 text-[11px] font-medium"
                                      >
                                        Assign
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Direct assign by wallet address */}
                            <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-2">
                              {apps.length > 0 ? "Or assign another wallet" : "Assign freelancer"}
                            </div>
                            <AssignFreelancerInput
                              onAssign={async (addr) => {
                                const h = await assignFreelancer(account!, id, addr);
                                await waitForReceipt(h);
                                invalidateAllCache();
                                await refresh();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <img src={shieldImg} alt="" width={100} height={100} className="drop-shadow-[0_0_30px_oklch(0.68_0.07_175/0.6)]" />
          <div className="mt-4 font-display text-2xl text-marble">Open Marketplace</div>
          <p className="mt-2 max-w-[220px] text-xs text-muted-foreground">
            Clients post jobs with locked funds. Freelancers apply. GenLayer AI verifies every milestone.
          </p>
        </div>
      }
    />
  );
}

// ─── 2. Dashboard ───────────────────────────────────────────────────────────

function DashboardDemo() {
  const { account, connected } = useWallet();
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [jobIds, setJobIds] = useState<bigint[]>([]);
  const [jobs, setJobs] = useState<Map<string, any>>(new Map());
  const [escrows, setEscrows] = useState<Map<string, any>>(new Map());
  const [applicants, setApplicants] = useState<Map<string, string[]>>(new Map());
  const [expanded, setExpanded] = useState<bigint | null>(null);
  const [verifyDetails, setVerifyDetails] = useState<Map<string, any>>(new Map());

  const refresh = async () => {
    if (!account) return;
    try {
      const fetchFn = role === "client" ? getClientJobs : getFreelancerJobs;
      const ids = await fetchFn(account);
      setJobIds(ids);
      const jm = new Map(jobs);
      const em = new Map(escrows);
      const ap = new Map(applicants);
      const uncached = ids.filter((id) => !jm.has(id.toString()));
      await Promise.all(uncached.map(async (id) => {
        try {
          const job = await getJob(id);
          jm.set(id.toString(), job);
          if (job.status === "assigned") {
            try {
              const eid = await getEscrowByJob(id);
              if (eid !== null) {
                const escrow = await getEscrow(eid);
                if (escrow) em.set(id.toString(), { ...escrow, escrowId: eid });
              }
            } catch { /* */ }
          }
          if (job.status === "open") {
            try { const apps = await getApplicants(id); if (apps.length > 0) ap.set(id.toString(), apps); } catch { /* */ }
          }
        } catch { /* skip */ }
      }));
      setJobs(jm);
      setEscrows(em);
      setApplicants(ap);
    } catch { /* no contract */ }
  };

  useEffect(() => { refresh(); }, [account, role]);
  useEffect(() => { if (!account) return; const t = setInterval(refresh, 15000); return () => clearInterval(t); }, [account, role]);

  if (!connected) return <EmptyState text="Connect wallet to see your dashboard." />;

  return (
    <DemoShell
      title={role === "client" ? "Jobs you posted" : "Jobs you're working on"}
      subtitle="View all your active and completed jobs."
      left={
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setRole("client")} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${role === "client" ? "btn-gold text-primary-foreground" : "border border-gold/20 text-muted-foreground hover:bg-gold/5"}`}>
              <Briefcase className="mx-auto mb-0.5 h-4 w-4" /> As Client
            </button>
            <button onClick={() => setRole("freelancer")} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${role === "freelancer" ? "btn-gold text-primary-foreground" : "border border-gold/20 text-muted-foreground hover:bg-gold/5"}`}>
              <UserCheck className="mx-auto mb-0.5 h-4 w-4" /> As Freelancer
            </button>
          </div>

          <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-gold-soft hover:text-foreground">
            <ExternalLink className="h-4 w-4" /> Refresh
          </button>

          {jobIds.length === 0 ? (
            <EmptyState text={role === "client" ? "You haven't posted any jobs yet." : "No jobs assigned to you yet. Browse Marketplace to apply."} />
          ) : (
            <div className="rounded-xl border border-gold/20 divide-y divide-gold/10 text-sm">
              {jobIds.map((id) => {
                const job = jobs.get(id.toString());
                const escrow = escrows.get(id.toString());
                return (
                  <div key={id.toString()}>
                    <button
                      onClick={() => setExpanded(expanded === id ? null : id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gold/5 transition-colors"
                    >
                      <span className="font-mono text-gold-soft shrink-0">#{id.toString()}</span>
                      <span className="flex-1 truncate text-marble font-medium">{job?.title || "…"}</span>
                      {job && <span className="text-muted-foreground shrink-0">{Number(job.total_budget || 0n) / 1e18} GEN</span>}
                      <Badge status={job?.status || "open"} />
                      {role === "client" && job?.status === "open" && applicants.has(id.toString()) && (
                        <span className="shrink-0 text-gold-soft text-xs">{applicants.get(id.toString())?.length || 0} app</span>
                      )}
                      {escrow && <span className="text-muted-foreground">{escrow.milestones?.filter((m: any) => m.status === "verified" || m.status === "paid").length || 0}/{escrow.milestones?.length || 0} done</span>}
                    </button>
                    {expanded === id && job && (
                      <div className="px-4 pb-4 space-y-3 text-sm">
                        <p className="text-marble leading-relaxed">{job.description}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-muted-foreground">
                          <span>Budget: <span className="text-gold-soft font-medium">{Number(job.total_budget) / 1e18} GEN</span></span>
                          <span>Status: <Badge status={job.status} /></span>
                          {job.milestone_titles?.length > 0 && (
                            <span>Milestones: <span className="text-marble font-medium">{job.milestone_titles.length}</span></span>
                          )}
                          {job.assigned_freelancer && job.assigned_freelancer !== "0x0000000000000000000000000000000000000000" && (
                            <span>Freelancer: <span className="font-mono text-marble">{job.assigned_freelancer.slice(0, 6)}…{job.assigned_freelancer.slice(-4)}</span></span>
                          )}
                        </div>
                        {/* Milestone list from JobPosting */}
                        {job.milestone_titles?.length > 0 && (
                          <div className="rounded-lg border border-gold/15 bg-black/20 p-3 space-y-1.5">
                            <div className="text-xs uppercase tracking-wider text-gold-soft">Milestones</div>
                            {job.milestone_titles.map((title: string, i: number) => {
                              const amount = job.milestone_amounts?.[i] || 0n;
                              const msEscrow = escrow?.milestones?.[i];
                              const vKey = id.toString() + ":" + i;
                              const vDetail = verifyDetails.get(vKey);
                              return (
                                <div key={i}>
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-marble">{title}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground">{Number(amount) / 1e18} GEN</span>
                                      {msEscrow && <Badge status={msEscrow.status} />}
                                      {msEscrow?.ai_score > 0 && <span className="text-gold-soft font-medium">{msEscrow.ai_score}/100</span>}
                                      {(msEscrow?.status === "verified" || msEscrow?.status === "rejected") && !vDetail && (
                                        <button onClick={async () => { try { const eid = escrow?.escrowId || await getEscrowByJob(id); const r = await getVerification(eid, BigInt(i)); if (r) setVerifyDetails((m) => { const n = new Map(m); n.set(vKey, r); return n; }); } catch {} }} className="text-xs text-gold-soft hover:text-foreground underline">details</button>
                                      )}
                                    </div>
                                  </div>
                                  {vDetail && (
                                    <div className="ml-2 mb-2 p-3 rounded bg-black/30 text-xs space-y-1.5 border border-gold/10">
                                      <div className={`font-medium ${vDetail.passed ? "text-green-400" : "text-red-400"}`}>{vDetail.passed ? "✓ Passed" : "✗ Rejected"} — Score: {vDetail.score}/100</div>
                                      <div className="text-muted-foreground leading-relaxed">{vDetail.reasoning}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Escrow details */}
                        {escrow && (
                          <div className="rounded-lg border border-gold/15 bg-black/20 p-3 space-y-1.5">
                            <div className="text-xs uppercase tracking-wider text-gold-soft">Escrow</div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>ID: <span className="font-mono text-marble">{escrow.job_id?.toString()}</span></span>
                              <span>Status: <Badge status={escrow.status} /></span>
                            </div>
                          </div>
                        )}
                        {/* Applicants for client open jobs */}
                        {role === "client" && job.status === "open" && applicants.has(id.toString()) && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-gold-soft mb-2">Applicants ({applicants.get(id.toString())?.length || 0})</div>
                            <div className="space-y-1.5">
                              {applicants.get(id.toString())?.map((a: string) => (
                                <div key={a} className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-2.5">
                                  <div className="flex items-center gap-2 font-mono text-marble">
                                    <UserCheck className="h-4 w-4 text-gold-soft" />
                                    <span>{a.slice(0, 8)}…{a.slice(-6)}</span>
                                  </div>
                                  <button
                                    onClick={async () => { const h = await assignFreelancer(account!, id, a); await waitForReceipt(h); invalidateAllCache(); await refresh(); }}
                                    className="rounded-lg border border-gold/20 px-3 py-1.5 text-gold-soft hover:bg-gold/5 text-xs font-medium"
                                  >
                                    Assign
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Users className="h-12 w-12 text-gold-soft" />
          <div className="mt-3 font-display text-xl text-marble">{role === "client" ? "Your jobs" : "Your work"}</div>
          <p className="mt-2 max-w-[220px] text-xs text-muted-foreground">
            {role === "client" ? "Jobs you posted. Assign freelancers, track milestone progress." : "Jobs assigned to you. Submit evidence and get verified."}
          </p>
        </div>
      }
    />
  );
}

// ─── 3. Verify (AI Consensus) ────────────────────────────────────────────────

const AI_STEPS = [
  { icon: Lightbulb, label: "Leader proposes", desc: "Lead validator reads evidence via LLM" },
  { icon: Users, label: "Validators check", desc: "5 validators independently evaluate" },
  { icon: Binary, label: "Consensus", desc: "Scores within 15 points = approved" },
  { icon: ScrollText, label: "On-chain record", desc: "Result stored permanently" },
];

type Evidence = { id: string; type: string; url: string; icon: React.ComponentType<{ className?: string }> };

const evidenceTypes = [
  { type: "GitHub", icon: Github, placeholder: "https://github.com/…" },
  { type: "Live URL", icon: Globe, placeholder: "https://…" },
  { type: "Figma", icon: ImageIcon, placeholder: "https://figma.com/…" },
  { type: "Docs", icon: FileText, placeholder: "https://docs…" },
];

function VerifyDemo() {
  const { account, connected } = useWallet();

  const [escrowId, setEscrowId] = useState("");
  const [milestoneIndex, setMilestoneIndex] = useState("0");
  const [jobDescription, setJobDescription] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [items, setItems] = useState<Evidence[]>([]);
  const [selectedType, setSelectedType] = useState(evidenceTypes[0]);
  const [url, setUrl] = useState("");

  const [state, setState] = useState<"idle" | "verifying" | "passed" | "failed">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<{ passed: boolean; score: number; reasoning: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch user's assigned jobs (as freelancer) for the escrow picker
  const [myEscrows, setMyEscrows] = useState<any[]>([]);
  useEffect(() => {
    if (!account) return;
    (async () => {
      try {
        const ids = await getFreelancerJobs(account);
        const entries = await Promise.all(ids.map(async (id) => {
          try {
            const job = await getJob(id);
            if (job.status === "assigned") {
              const escrowId = await getEscrowByJob(id);
              const escrow = escrowId !== null ? await getEscrow(escrowId) : null;
              return {
                jobId: id,
                escrowId: escrowId,
                title: job.title,
                jobDescription: escrow?.job_description || job.description || "",
                milestones: escrow?.milestones || job.milestone_titles?.map((t: string, i: number) => ({
                  title: t,
                  description: job.milestone_descriptions?.[i] || "",
                  amount: job.milestone_amounts?.[i] || 0n,
                  status: "pending",
                })) || [],
              };
            }
          } catch { /* */ }
          return null;
        }));
        setMyEscrows(entries.filter(Boolean));
      } catch { /* */ }
    })();
  }, [account]);

  const add = () => {
    if (!url.trim()) return;
    setItems((it) => [...it, { id: crypto.randomUUID(), type: selectedType.type, url: url.trim(), icon: selectedType.icon }]);
    setUrl("");
  };

  const loadEscrow = async (id?: string) => {
    const eid = id || escrowId;
    if (!eid) return;
    if (id) setEscrowId(id);
    setErrorMsg("");
    try {
      const data: any = await getEscrow(BigInt(eid));
      setJobDescription(data.job_description || "");
      if (data.milestones?.length > 0) {
        const idx = parseInt(milestoneIndex) || 0;
        const ms = data.milestones[Math.min(idx, data.milestones.length - 1)];
        setMilestoneTitle(ms.title || "");
        setMilestoneDescription(ms.description || "");
      }
    } catch { setErrorMsg("Escrow not found — did you post a job and assign a freelancer yet? Go to Marketplace → open your job → assign a wallet address."); }
  };

  const verify = async () => {
    if (items.length === 0) return;
    setState("verifying");
    setCurrentStep(0);
    setErrorMsg("");
    setResult(null);

    // Animate through AI steps
    for (let i = 0; i <= AI_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      setCurrentStep(i);
      if (i === AI_STEPS.length) break;
    }

    try {
      const txHash = await verifyMilestone(account!, {
        escrowId: BigInt(escrowId),
        milestoneIndex: BigInt(milestoneIndex),
        evidenceUrls: items.map((i) => i.url),
        evidenceTypes: items.map((i) => i.type),
        jobDescription,
        milestoneTitle,
        milestoneDescription,
      });

      await waitForReceipt(txHash);

      // Fetch verification result from contract
      const v = await getVerification(BigInt(escrowId), BigInt(milestoneIndex));
      setResult({ passed: v.passed, score: v.score, reasoning: v.reasoning });
      setState(v.passed ? "passed" : "failed");
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Verification failed";
      // Try to extract revert reason from nested errors
      const cause = e?.cause?.message || e?.cause || "";
      setErrorMsg(cause.includes("reverted") ? cause : msg);
      setState("failed");
    }
  };

  const canVerify = escrowId.trim() && jobDescription.trim() && milestoneTitle.trim() && items.length > 0 && connected;

  return (
    <DemoShell
      title="AI Milestone Verification"
      subtitle="Submit evidence and let GenLayer validators independently verify your work using AI consensus."
      left={
        <div className="space-y-3">
          {/* Prerequisites guide */}
          <div className="rounded-xl border border-gold/20 bg-blue-500/[0.04] p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 text-gold-soft font-medium">
              <Lightbulb className="h-3.5 w-3.5" /> Before you verify
            </div>
            <p>1. Client posts a job in <span className="text-marble">Marketplace</span></p>
            <p>2. Freelancer applies (or client assigns directly by wallet address)</p>
            <p>3. Escrow is created — use <span className="font-mono text-marble">Escrow ID</span> below</p>
            <p>4. <span className="text-gold-soft">Only the assigned freelancer</span> can submit evidence &amp; verify</p>
          </div>

          {/* AI Consensus Explanation */}
          <div className="rounded-xl border border-gold/20 bg-gold/[0.03] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold-soft mb-3">
              <Lightbulb className="h-3.5 w-3.5" /> How GenLayer AI consensus works
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AI_STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    state === "verifying"
                      ? currentStep > i
                        ? "border-green-500/40 bg-green-500/5"
                        : currentStep === i
                          ? "border-gold/60 bg-gold/10 animate-pulse"
                          : "border-gold/10 opacity-40"
                      : "border-gold/10"
                  }`}
                >
                  <s.icon className={`h-4 w-4 mb-1 ${state === "verifying" && currentStep >= i ? "text-gold-soft" : "text-muted-foreground"}`} />
                  <div className="text-xs font-medium text-marble">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow selection — dropdown picker */}
          <div className="rounded-xl border border-gold/20 p-4 space-y-3">
            <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">1. Select escrow</div>

            {myEscrows.filter((e) => (e.milestones || []).some((m: any) => m.status !== "verified" && m.status !== "paid")).length > 0 ? (
              <select
                value={escrowId}
                onChange={(e) => {
                  const val = e.target.value;
                  setEscrowId(val);
                  if (val) {
                    const entry = myEscrows.find((x) => x.escrowId?.toString() === val);
                    if (entry) {
                      setJobDescription(entry.jobDescription || "");
                      setMilestoneIndex("0");
                      const avail = entry.milestones?.filter((m: any) => m.status !== "verified" && m.status !== "paid") || [];
                      if (avail.length > 0) {
                        const ms = avail[0];
                        setMilestoneTitle(ms.title || "");
                        setMilestoneDescription(ms.description || "");
                      }
                    }
                  }
                }}
                className="input w-full text-sm"
              >
                <option value="">— Select escrow —</option>
                {myEscrows
                  .filter((e) => (e.milestones || []).some((m: any) => m.status !== "verified" && m.status !== "paid"))
                  .map((e) => {
                    const remain = (e.milestones || []).filter((m: any) => m.status !== "verified" && m.status !== "paid").length;
                    return (
                      <option key={e.escrowId?.toString()} value={e.escrowId?.toString()}>
                        Escrow #{e.escrowId?.toString()} — {e.title} ({remain} pending)
                      </option>
                    );
                  })}
              </select>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">No assigned jobs with pending milestones. Assign a freelancer first.</div>
            )}

            {escrowId && (
              <>
                {/* Milestone picker — only pending/rejected milestones shown */}
                {(() => {
                  const entry = myEscrows.find((e) => e.escrowId?.toString() === escrowId);
                  const avail = entry?.milestones?.filter((m: any) => m.status !== "verified" && m.status !== "paid") || [];
                  return avail.length > 1 ? (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-1">2. Select milestone</div>
                      <select
                        value={milestoneIndex}
                        onChange={(e) => {
                          const idx = e.target.value;
                          setMilestoneIndex(idx);
                          if (entry?.milestones?.[parseInt(idx)]) {
                            const ms = entry.milestones[parseInt(idx)];
                            setMilestoneTitle(ms.title || "");
                            setMilestoneDescription(ms.description || "");
                          }
                        }}
                        className="input w-full text-sm"
                      >
                        {entry?.milestones?.map((ms: any, i: number) => {
                          const done = ms.status === "verified" || ms.status === "paid";
                          return (
                            <option key={i} value={i.toString()} disabled={done}>
                              Milestone {i + 1}: {ms.title} ({Number(ms.amount) / 1e18} GEN) — {ms.status} {done ? "(done)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : avail.length === 1 ? null : (
                    <div className="text-xs text-muted-foreground">All milestones have been verified or paid.</div>
                  );
                })()}

                {/* Auto-filled context (read-only) */}
                <div className="rounded-lg bg-black/20 p-3 space-y-1.5 text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-gold-soft">Job context (auto-filled)</div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="input resize-none text-xs"
                    rows={2}
                    placeholder="Job description"
                  />
                  <div className="flex gap-2">
                    <input value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} className="input text-xs flex-1" placeholder="Milestone title" />
                    <input value={milestoneDescription} onChange={(e) => setMilestoneDescription(e.target.value)} className="input text-xs flex-1" placeholder="Milestone description" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Evidence */}
          <div className="rounded-xl border border-gold/20 p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-gold-soft mb-3">Attach evidence</div>
            <div className="flex flex-wrap gap-2">
              {evidenceTypes.map((t) => (
                <button key={t.type} onClick={() => setSelectedType(t)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedType.type === t.type ? "border-gold/60 bg-gold/10 text-marble" : "border-gold/20 text-muted-foreground hover:text-foreground"
                  }`}
                ><t.icon className="h-4 w-4" /> {t.type}</button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={selectedType.placeholder} className="input flex-1" />
              <button onClick={add} className="btn-ghost-gold rounded-lg px-4 text-sm hover:bg-gold/10">Add</button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-1">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-lg border border-gold/15 bg-white/[0.02] p-2.5 text-xs">
                  <it.icon className="h-3.5 w-3.5 text-gold" />
                  <span className="uppercase tracking-widest text-gold-soft w-16">{it.type}</span>
                  <span className="flex-1 truncate text-marble">{it.url}</span>
                  <button onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))} className="text-muted-foreground hover:text-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button onClick={async () => { for (const it of items) { try { const h = await submitEvidence(account!, BigInt(escrowId), BigInt(milestoneIndex), it.url); await waitForReceipt(h); } catch { /* */ } } invalidateAllCache(); }} type="button" className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-foreground mt-1">
                <ExternalLink className="h-3 w-3" /> Submit evidence on-chain
              </button>
            </div>
          )}

          {!connected && <div className="rounded-lg border border-gold/20 bg-gold/5 p-2 text-xs text-gold-soft text-center">Connect wallet to verify</div>}

          <button onClick={verify} disabled={!canVerify || state === "verifying" || state === "passed"}
            className="btn-gold w-full rounded-full py-3.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === "verifying" ? "AI deliberating…" : state === "passed" ? "✓ Milestone approved" : state === "failed" ? "Retry" : "Verify with GenLayer AI"}
          </button>

          {result && (
            <div className={`rounded-xl border p-4 space-y-2 ${result.passed ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-marble">{result.passed ? "✓ Milestone approved" : "✗ Milestone rejected"}</span>
                <span className="text-lg font-display text-gold-gradient">{result.score}/100</span>
              </div>
              <p className="text-xs text-muted-foreground">{result.reasoning}</p>
              {result.passed && <p className="text-xs text-gold-soft">Next: Client releases payment in the Release tab.</p>}
              {!result.passed && <p className="text-xs text-red-400">Add more evidence and verify again, or open a dispute.</p>}
            </div>
          )}

          {errorMsg && <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{errorMsg}</div>}
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <RomanCandle active={state === "verifying"} durationMs={6000} label="AI consensus" size="lg" />
          <div className="mt-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {state === "verifying"
              ? currentStep < AI_STEPS.length
                ? AI_STEPS[currentStep]?.label || ""
                : "Finalizing on chain…"
              : state === "passed"
                ? "Consensus reached"
                : state === "failed"
                  ? "Consensus rejected"
                  : "Awaiting verification"}
          </div>
          <p className="mt-auto max-w-[220px] text-xs text-muted-foreground">
            GenLayer validators independently evaluate your evidence and reach consensus through AI.
          </p>
        </div>
      }
    />
  );
}

// ─── 4. Release ─────────────────────────────────────────────────────────────

function ReleaseDemo() {
  const { account, connected } = useWallet();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [milestoneIndex, setMilestoneIndex] = useState<number>(0);
  const [stage, setStage] = useState<"idle" | "releasing" | "released" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMyEscrows = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const ids = await getClientJobs(account);
      const results: any[] = [];
      for (const id of ids) {
        try {
          const job = await getJob(id);
          if (job.status === "assigned") {
            const eid = await getEscrowByJob(id);
            if (eid !== null) {
              const escrow = await getEscrow(eid);
              if (escrow) results.push({ ...escrow, escrowId: eid, jobTitle: job.title });
            }
          }
        } catch { /* */ }
      }
      setEscrows(results);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadMyEscrows(); }, [account]);

  const release = async () => {
    if (!account || !selectedEscrow) return;
    setStage("releasing");
    setErrorMsg("");
    try {
      const txHash = await releasePayment(account, selectedEscrow.escrowId, BigInt(milestoneIndex));
      await waitForReceipt(txHash);
      try {
        const ms = selectedEscrow.milestones?.[milestoneIndex];
        const amount = BigInt(ms?.amount || 0n);
        await recordJob(account!, selectedEscrow.client, "client", amount, true).catch(() => {});
        await recordJob(account!, selectedEscrow.freelancer, "freelancer", amount, true).catch(() => {});
        invalidateAllCache();
      } catch { /* */ }
      setStage("released");
      loadMyEscrows();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Release failed");
      setStage("error");
    }
  };

  const selectedMs = selectedEscrow?.milestones?.[milestoneIndex];

  return (
    <DemoShell
      title="Release milestone payment"
      subtitle="Your escrows with verified milestones. Only the client can release."
      left={
        <div className="space-y-4">
          {!connected && <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs text-gold-soft text-center">Connect wallet to release</div>}

          {loading ? (
            <div className="text-xs text-muted-foreground text-center">Loading your escrows…</div>
          ) : escrows.length === 0 ? (
            <EmptyState text="No escrows with assigned freelancers found. Post a job and assign a freelancer first." />
          ) : (
            <div className="space-y-3">
              {/* Escrow selector */}
              <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Select escrow</div>
              <div className="rounded-xl border border-gold/20 divide-y divide-gold/10 text-sm">
                {escrows.map((escrow, i) => {
                  const verifiedCount = escrow.milestones?.filter((m: any) => m.status === "verified").length || 0;
                  const paidCount = escrow.milestones?.filter((m: any) => m.status === "paid").length || 0;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedEscrow(escrow); setMilestoneIndex(0); setStage("idle"); setErrorMsg(""); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gold/5 transition-all ${
                        selectedEscrow?.escrowId === escrow.escrowId ? "bg-gold/10 border-l-2 border-gold" : ""
                      }`}
                    >
                      <span className="font-mono text-gold-soft shrink-0">#{escrow.escrowId?.toString()}</span>
                      <span className="flex-1 truncate text-marble font-medium">{escrow.jobTitle || escrow.job_title}</span>
                      <span className="text-xs text-muted-foreground">{paidCount + verifiedCount}/{escrow.milestones?.length || 0} ready</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected escrow details */}
              {selectedEscrow && (
                <div className="rounded-xl border border-gold/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-marble font-medium">{selectedEscrow.jobTitle || selectedEscrow.job_title}</div>
                    <Badge status={selectedEscrow.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Freelancer: <span className="font-mono text-marble">{selectedEscrow.freelancer?.slice(0, 6)}…{selectedEscrow.freelancer?.slice(-4)}</span>
                    — Budget: <span className="text-gold-soft">{Number(selectedEscrow.budget || 0n) / 1e18} GEN</span>
                  </div>

                  {/* Milestone list */}
                  <div className="text-xs uppercase tracking-wider text-gold-soft">Milestones</div>
                  <div className="space-y-1.5">
                    {selectedEscrow.milestones?.map((ms: any, i: number) => {
                      const isPaid = ms.status === "paid";
                      const isVerified = ms.status === "verified";
                      const isSelected = milestoneIndex === i;
                      return (
                        <button
                          key={i}
                          onClick={() => { if (!isPaid) { setMilestoneIndex(i); setStage("idle"); setErrorMsg(""); } }}
                          disabled={isPaid}
                          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                            isSelected && !isPaid
                              ? "border-gold/60 bg-gold/10"
                              : isPaid
                                ? "border-green-500/20 bg-green-500/5 opacity-50"
                                : "border-gold/15 bg-black/20 hover:bg-gold/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[11px] font-mono text-gold-soft">{i + 1}</span>
                            <div>
                              <div className="text-sm text-marble">{ms.title}</div>
                              <div className="text-xs text-muted-foreground">{Number(ms.amount) / 1e18} GEN</div>
                            </div>
                          </div>
                          <Badge status={ms.status} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMs && (
            <button onClick={release} disabled={selectedMs.status !== "verified" || stage === "releasing" || stage === "released"}
              className="btn-gold w-full rounded-full py-3.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stage === "released" ? "✓ Payment released" : stage === "releasing" ? "Releasing…" : stage === "error" ? "Retry" : selectedMs.status === "paid" ? "Already paid" : "Release payment"}
            </button>
          )}

          {stage === "released" && <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-400">Payment released — freelancer credited.</div>}
          {errorMsg && <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{errorMsg}</div>}

          <button onClick={loadMyEscrows} className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-foreground">
            <ExternalLink className="h-3 w-3" /> Refresh escrows
          </button>
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <RomanCandle active={stage === "releasing"} durationMs={4000} label="Releasing funds" size="lg" />
          <p className="mt-6 max-w-[220px] text-xs text-muted-foreground">
            Funds are locked in the Intelligent Contract. Release only after AI verification passes.
          </p>
        </div>
      }
    />
  );
}

// ─── 5. Dispute ──────────────────────────────────────────────────────────────

function DisputeDemo() {
  const { account, connected } = useWallet();

  const [step, setStep] = useState<"open" | "votes" | "resolve" | "execute" | "done">("open");

  const [escrowId, setEscrowId] = useState("");
  const [milestoneIdx, setMilestoneIdx] = useState("");
  const [clientStmt, setClientStmt] = useState("");
  const [freelancerStmt, setFreelancerStmt] = useState("");
  const [clientAddr, setClientAddr] = useState("");
  const [freelancerAddr, setFreelancerAddr] = useState("");
  // Composite key "escrowId:milestoneIdx" for dropdown value
  const dropdownVal = escrowId && milestoneIdx ? escrowId + ":" + milestoneIdx : "";

  // Auto-load user's escrows for dispute picker
  const [myDisputeEscrows, setMyDisputeEscrows] = useState<any[]>([]);
  const [loadingEscrows, setLoadingEscrows] = useState(true);

  useEffect(() => {
    if (!account) { setLoadingEscrows(false); return; }
    (async () => {
      setLoadingEscrows(true);
      try {
        const [cIds, fIds] = await Promise.all([getClientJobs(account).catch(() => []), getFreelancerJobs(account).catch(() => [])]);
        const allIds = [...new Set([...cIds, ...fIds])];
        const results: any[] = [];
        const entries = await Promise.all(allIds.map(async (id) => {
          try {
            const job = await getJob(id);
            if (job.status === "assigned") {
              const eid = await getEscrowByJob(id);
              if (eid !== null) {
                const escrow = await getEscrow(eid);
                if (escrow) return { ...escrow, escrowId: eid, jobTitle: job.title, jobId: id };
              }
            }
          } catch { /* */ }
          return null;
        }));
        for (const e of entries) { if (e) results.push(e); }
        setMyDisputeEscrows(results);
      } catch { /* */ }
      setLoadingEscrows(false);
    })();
  }, [account]);

  const selectDisputeEscrow = (escrow: any, msIdx: number) => {
    setEscrowId(escrow.escrowId.toString());
    setMilestoneIdx(msIdx.toString());
    setClientAddr(escrow.client || "");
    setFreelancerAddr(escrow.freelancer || "");
    getVerification(escrow.escrowId, BigInt(msIdx)).then(setDisputeVerification).catch(() => setDisputeVerification(null));
  };

  const canOpen = escrowId.trim().length > 0 && clientStmt.trim().length > 0 && freelancerStmt.trim().length > 0 && connected;

  const [disputeId, setDisputeId] = useState<bigint | null>(null);
  const [manualDisputeId, setManualDisputeId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [disputeVerification, setDisputeVerification] = useState<any>(null);

  const [juryVotes, setJuryVotes] = useState<{ vote: string; reasoning: string }[]>([]);
  const [currentVote, setCurrentVote] = useState<{ vote: string; reasoning: string }>({ vote: "client", reasoning: "" });

  const [resolution, setResolution] = useState<any>(null);
  const [execution, setExecution] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const handleOpen = async () => {
    if (!canOpen || !account) return;
    setError(""); setLoading(true); setDebugInfo("");
    try {
      const hash = await openDispute(account, BigInt(escrowId), BigInt(milestoneIdx || "0"), clientStmt, [], freelancerStmt, []);
      setTxHash(hash);
      await waitForReceipt(hash);
      invalidateAllCache();
      setDebugInfo("tx OK, escrowId=" + escrowId);
      // Find dispute ID from events, else read fresh dispute counter (with retries)
      let found = false;
      try {
        const events = await getEscrowEvents(BigInt(escrowId));
        setDebugInfo("events=" + (events?.length ?? 0));
        const discEvent = events.find((e: any) => e.description?.includes("Dispute #"));
        if (discEvent) { const m = discEvent.description.match(/#(\d+)/); if (m) { setDisputeId(BigInt(m[1])); found = true; setDebugInfo("found via event Dispute #" + m[1]); } }
      } catch (e: any) { setDebugInfo("events ERR: " + (e?.message || e)); }
      if (!found) {
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const c = await getDisputeCounterFresh();
            setDebugInfo("counter=" + c.toString());
            if (c > 0n) {
              for (let i = Number(c) - 1; i >= 0; i--) {
                const d = await getDisputeFresh(BigInt(i));
                if (d && d.escrow_id?.toString() === escrowId) {
                  setDisputeId(BigInt(i));
                  found = true;
                  setDebugInfo("found dispute #" + i);
                  break;
                }
              }
              if (found) break;
            }
          } catch (e: any) { setDebugInfo("counter ERR: " + (e?.message || e)); }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      if (!found) setError("Could not find dispute ID — check the explorer for your open_dispute tx.");
      setStep("resolve");
    } catch (e: any) { setError(e?.shortMessage || e?.message || "Open dispute failed"); }
    finally { setLoading(false); }
  };

  const handleCastVote = async () => {
    if (!account) { setError("Connect wallet first."); return; }
    if (!disputeId) { setError("Dispute ID not found. Re-open the dispute or reset."); return; }
    if (!currentVote.vote || !currentVote.reasoning.trim()) { setError("Please add reasoning before voting."); return; }
    setError(""); setLoading(true);
    try {
      const hash = await castJurorVote(account, disputeId, currentVote.vote, currentVote.reasoning);
      await waitForReceipt(hash);
      setJuryVotes((v) => [...v, { vote: currentVote.vote, reasoning: currentVote.reasoning }]);
      setCurrentVote({ vote: "client", reasoning: "" });
      if (juryVotes.length + 1 >= 5) setStep("resolve");
      invalidateAllCache();
    } catch (e: any) { setError(e?.shortMessage || e?.message || "Cast vote failed"); }
    finally { setLoading(false); }
  };

  const handleResolve = async () => {
    let did = disputeId;
    if (!did && manualDisputeId.trim()) did = BigInt(manualDisputeId.trim());
    if (!did) { setError("Dispute ID not found. Enter it manually below or re-open the dispute."); return; }
    setError(""); setLoading(true);
    try {
      const hash = await resolveDispute(account!, did);
      await waitForReceipt(hash);
      const d = await getDispute(did);
      setResolution(d);
      setStep("execute");
      invalidateAllCache();
    } catch (e: any) { setError(e?.shortMessage || e?.message || "Resolve failed"); }
    finally { setLoading(false); }
  };

  const handleExecute = async () => {
    if (!disputeId || !account) return;
    setError(""); setLoading(true);
    try {
      const hash = await executeDisputeVerdict(account, disputeId);
      await waitForReceipt(hash);
      const escrow = await getEscrow(BigInt(escrowId));
      setExecution(escrow);
      setStep("done");
      invalidateAllCache();
      // Record dispute result for winner (silent if not registered)
      if (escrow?.winner && escrow.winner !== "0x0000000000000000000000000000000000000000") {
        const loser = escrow.winner.toLowerCase() === (escrow.client || "").toLowerCase()
          ? escrow.freelancer : escrow.client;
        await recordDisputeResult(account!, escrow.winner, true).catch(() => {});
        if (loser) await recordDisputeResult(account!, loser, false).catch(() => {});
      }
    } catch (e: any) { setError(e?.shortMessage || e?.message || "Execute failed"); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep("open"); setEscrowId(""); setMilestoneIdx(""); setClientStmt(""); setFreelancerStmt(""); setClientAddr(""); setFreelancerAddr("");
    setDisputeId(null); setManualDisputeId(""); setTxHash(""); setJuryVotes([]); setDisputeVerification(null);
    setCurrentVote({ vote: "client", reasoning: "" });
    setResolution(null); setExecution(null); setError("");
  };

  const examples = [
    { escrowId: "0", milestoneIdx: "0", client: "The freelancer delivered the DeFi dashboard a week late and the wallet connect feature doesn't work with Ledger. I paid 0.6 GEN upfront and expected a working product. He refuses to fix the bugs unless I pay more.", freelancer: "I completed all 4 milestones on time. The client kept adding extra features mid-project and now blames me for scope creep. The Ledger issue is a known browser limitation, not a bug. I offered to fix it for an additional 0.1 GEN since it was out of scope." },
    { escrowId: "1", milestoneIdx: "2", client: "I hired him for a smart contract audit. The report only found 2 issues when we later discovered 7 critical vulnerabilities. The audit was incomplete and I had to pay another auditor 0.5 GEN to redo the work. He refuses a refund.", freelancer: "The contract was 95% complete when I received it. I explicitly stated my audit scope was limited to the Solidity code provided. The client later added new modules that I never reviewed. My report clearly stated the scope limitations." },
    { escrowId: "2", milestoneIdx: "1", client: "He built an NFT minting page but the gas estimation is completely wrong — users overpay by 3x on every mint. I asked for a fix 2 weeks ago and he keeps saying 'next week'. I want the milestone payment of 0.2 GEN returned.", freelancer: "I provided a working gas estimation module. The client deployed it with a different provider configuration that broke the estimates. I've offered 3 times to fix the configuration but the client won't share their deployment setup for debugging." },
    { escrowId: "3", milestoneIdx: "0", client: "The AI chatbot integration was supposed to support GPT-4 but the delivered version only uses GPT-3.5. The response quality is noticeably worse and users are complaining. I paid 0.8 GEN for premium integration.", freelancer: "The project specification said 'LLM API integration' without specifying the model tier. GPT-4 costs 20x more per token. I built the integration to use whatever model the API key has access to. The client uses a free-tier key that only allows GPT-3.5." },
    { escrowId: "4", milestoneIdx: "3", client: "The DAO governance dApp has a critical bug: proposal votes aren't counted correctly when quorum is reached on the last day. We lost a $10k treasury vote because of this. The freelancer blames the testing environment.", freelancer: "I delivered the code with full test coverage and a working demo on the testnet. The client modified the voting parameters after deployment without updating the quorum calculation. I can provide git history showing the client's changes broke the logic." },
  ];

  const stepLabels = ["1. Open", "2. AI Resolve", "3. Execute", "Done"];
  const stepIndex = ["open", "resolve", "execute", "done"].indexOf(step);

  return (
    <DemoShell
      title="Dispute resolution by AI consensus"
      subtitle="AI fetches the submitted work + both statements, then renders a binding verdict."
      left={
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] uppercase tracking-wider">
            {stepLabels.map((label, i) => (
              <div key={i} className={`flex items-center gap-1 ${i <= stepIndex ? "text-gold-soft" : "text-muted-foreground/40"}`}>
                <div className={`w-5 h-5 rounded-full grid place-items-center text-[9px] font-mono ${i <= stepIndex ? "bg-gold/20 text-gold-soft" : "bg-gold/5 text-muted-foreground/40"}`}>{i + 1}</div>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>

          {step === "open" && (
            <div className="space-y-4">
              {/* Escrow & milestone picker */}
              <div className="rounded-xl border border-gold/20 p-4 space-y-3">
                <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">1. Select escrow</div>
                {loadingEscrows ? (
                  <div className="text-xs text-muted-foreground text-center py-2">Loading your escrows…</div>
                ) : myDisputeEscrows.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">No milestones ready for dispute. Complete a verification first (AI Verify tab), then disputed/rejected milestones will appear here.</div>
                ) : (
                  <select
                    value={dropdownVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [eid, midx] = val.split(":");
                        const escrow = myDisputeEscrows.find((x) => x.escrowId?.toString() === eid);
                        if (escrow) {
                          selectDisputeEscrow(escrow, parseInt(midx));
                        }
                      } else {
                        setEscrowId("");
                      }
                    }}
                    className="input w-full text-sm"
                  >
                    <option value="">— Select escrow —</option>
                    {myDisputeEscrows.map((escrow) =>
                      (escrow.milestones || []).map((ms: any, i: number) => {
                        if (ms.status !== "verified" && ms.status !== "rejected") return null;
                        return (
                          <option key={escrow.escrowId?.toString() + ":" + i} value={escrow.escrowId?.toString() + ":" + i}>
                            #{escrow.escrowId?.toString()} — {escrow.jobTitle || escrow.job_title} — M{i + 1}: {ms.title}
                          </option>
                        );
                      })
                    )}
                  </select>
                )}
              </div>

              {/* Selected escrow info */}
              {escrowId && clientAddr && (
                <div className="rounded-xl border border-gold/15 bg-black/10 p-3 text-xs text-muted-foreground">
                  Client: <span className="font-mono text-marble">{clientAddr.slice(0, 6)}…{clientAddr.slice(-4)}</span>
                  {" | "}Freelancer: <span className="font-mono text-marble">{freelancerAddr.slice(0, 6)}…{freelancerAddr.slice(-4)}</span>
                </div>
              )}

              {/* AI verification result */}
              {disputeVerification && (
                <div className={`rounded-xl border p-3 space-y-1.5 ${disputeVerification.passed ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                  <div className="text-xs uppercase tracking-wider text-gold-soft">AI Verification Result</div>
                  <div className={`text-sm font-medium ${disputeVerification.passed ? "text-green-400" : "text-red-400"}`}>
                    {disputeVerification.passed ? "✓ Passed" : "✗ Rejected"} — Score: {disputeVerification.score}/100
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{disputeVerification.reasoning}</div>
                </div>
              )}

              {/* Statements */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Client's statement">
                  <textarea value={clientStmt} onChange={(e) => setClientStmt(e.target.value)} rows={4} placeholder="Explain the client's position…" className="input resize-none" />
                </Field>
                <Field label="Freelancer's statement">
                  <textarea value={freelancerStmt} onChange={(e) => setFreelancerStmt(e.target.value)} rows={4} placeholder="Explain the freelancer's position…" className="input resize-none" />
                </Field>
              </div>
              <button onClick={() => { const pick = examples[Math.floor(Math.random() * examples.length)]; setClientStmt(pick.client); setFreelancerStmt(pick.freelancer); }} type="button" className="inline-flex items-center gap-2 rounded-lg border border-gold/20 px-3 py-1.5 text-xs text-gold-soft hover:bg-gold/5 transition-colors">
                <Sparkles className="h-3.5 w-3.5" /> Random fill example
              </button>
              <button onClick={handleOpen} disabled={!canOpen || loading} className="btn-gold w-full rounded-full py-3.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Opening…" : "Open dispute"}
              </button>
            </div>
          )}

          {step === "resolve" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gold/20 p-4 text-center space-y-3">
                <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">AI resolution</div>
                <p className="text-sm text-muted-foreground">AI fetches the submitted work + evidence, then validators independently reason to reach a binding verdict.</p>
                {disputeId && <div className="text-xs text-gold-soft">Dispute #{disputeId.toString()}</div>}
                {!disputeId && (
                  <div className="flex gap-2">
                    <input value={manualDisputeId} onChange={(e) => setManualDisputeId(e.target.value)} className="input flex-1 text-center font-mono" placeholder="Dispute ID (manual)" />
                  </div>
                )}
                {debugInfo && <div className="rounded-lg bg-black/20 p-2 text-[10px] text-muted-foreground font-mono break-all">{debugInfo}</div>}
                <button onClick={handleResolve} disabled={loading} className="btn-gold rounded-full px-8 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "AI resolving…" : "Resolve with AI"}
                </button>
              </div>
            </div>
          )}

          {step === "execute" && resolution && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gold/20 p-4 space-y-3">
                <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Verdict</div>
                <div className={`text-2xl font-display text-center ${resolution.verdict === "freelancer" ? "text-green-400" : "text-destructive"}`}>
                  {resolution.verdict === "client" ? "Client" : resolution.verdict === "freelancer" ? "Freelancer" : "Split"} wins
                </div>
                {resolution.juror_votes?.length > 0 && (
                  <div className="flex justify-center gap-1">
                    {resolution.juror_votes.map((v: any, i: number) => (
                      <span key={i} className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${v.vote === "client" ? "bg-destructive/10 text-destructive" : v.vote === "freelancer" ? "bg-green-400/10 text-green-400" : "bg-gold/10 text-gold-soft"}`}>{v.vote}</span>
                    ))}
                  </div>
                )}
                <button onClick={handleExecute} disabled={loading} className="btn-gold w-full rounded-full py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Executing…" : "Execute & release funds"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && execution && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-400/30 bg-green-400/5 p-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-400" />
                <div className="font-display text-xl text-gold-gradient">Dispute resolved</div>
                <div className="text-xs text-muted-foreground">
                  Escrow #{escrowId} — Winner: {execution.winner === "0x0000000000000000000000000000000000000000" ? "Split" : execution.winner?.slice(0, 10) + "…"}
                  <br />
                  Status: {execution.status === "refunded" ? "Refunded to client" : execution.status}
                </div>
                <button onClick={reset} className="text-xs text-gold-soft hover:text-foreground underline underline-offset-2">Start new dispute</button>
              </div>
            </div>
          )}

          {txHash && (
            <div className="rounded-xl border border-gold/20 p-3 text-xs space-y-1">
              <div className="text-gold-soft uppercase tracking-wider">Tx</div>
              <a href={`https://explorer-studio.genlayer.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-marble underline underline-offset-2 break-all">{txHash.slice(0, 20)}…{txHash.slice(-8)}</a>
              {disputeId && <div className="text-muted-foreground">Dispute #{disputeId.toString()}</div>}
            </div>
          )}

          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <RomanCandle active={step !== "open" && step !== "done"} durationMs={8000} label="Dispute flow" size="lg" />
          <div className="mt-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {step === "open" ? "Awaiting dispute" : step === "votes" ? "Jurors voting" : step === "resolve" ? "AI deliberating" : step === "execute" ? "Ready to execute" : "Resolved"}
          </div>
          <p className="mt-2 max-w-[200px] text-[10px] text-muted-foreground">
            {step === "open" ? "Fill the dispute details and open it on-chain." :
             step === "resolve" ? "AI fetches the submitted work + evidence, then renders a binding verdict." :
             step === "execute" ? "Execute to atomically release funds to the winner." :
             "Funds released. Escrow closed."}
          </p>
        </div>
      }
    />
  );
}

function HistoryDemo() {
  const { account, connected } = useWallet();
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [completed, setCompleted] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!account) return;
    setLoading(true);
    const fetchFn = role === "client" ? getClientJobs : getFreelancerJobs;
    try {
      const ids = await fetchFn(account);
      const list: any[] = (await Promise.all(ids.map(async (id) => {
        try {
          const job = await getJob(id);
          if (job.status === "completed") {
            let escrow = null;
            try { escrow = await getEscrow(id); } catch {}
            return { ...job, jobId: id, escrow };
          }
        } catch {}
        return null;
      }))).filter(Boolean);
      setCompleted(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [account, role]);

  if (!connected) return <DemoShell title="History" subtitle="Connect wallet to see completed jobs." left={<EmptyState text="Connect your wallet first." />} right={<div />} />;

  const label = role === "client" ? "As Client" : "As Freelancer";

  return (
    <DemoShell
      title={`Completed Jobs — ${label}`}
      subtitle="Jobs that have been fully verified and paid out."
      left={
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setRole("client")} className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${role === "client" ? "btn-gold text-primary-foreground" : "border border-gold/20 text-muted-foreground hover:bg-gold/5"}`}>
              As Client
            </button>
            <button onClick={() => setRole("freelancer")} className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${role === "freelancer" ? "btn-gold text-primary-foreground" : "border border-gold/20 text-muted-foreground hover:bg-gold/5"}`}>
              As Freelancer
            </button>
          </div>
          <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-foreground disabled:opacity-50">
            <ExternalLink className="h-3 w-3" /> {loading ? "Loading..." : "Refresh"}
          </button>
          {completed.length === 0 ? (
            <EmptyState text={loading ? "Loading..." : `No completed jobs yet for this ${role} account.`} />
          ) : (
            <div className="grid gap-3">
              {completed.map((job) => {
                const isExpanded = expandedId === job.jobId;
                const ms = job.milestone_titles || [];
                return (
                  <div key={job.jobId.toString()} className={`rounded-xl border transition-all ${isExpanded ? "border-gold/50 bg-gold/[0.04]" : "border-gold/15 bg-black/20 hover:border-gold/30"}`}>
                    <button onClick={() => setExpandedId(isExpanded ? null : job.jobId)} className="w-full text-left p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] text-gold-soft/60 bg-gold/5 px-1.5 py-0.5 rounded">#{job.jobId.toString()}</span>
                            <h3 className="font-display text-lg text-marble truncate">{job.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display text-xl text-gold-gradient">{Number(job.total_budget) / 1e18} <span className="text-xs">GEN</span></div>
                          {job.escrow && (
                            <div className={`text-[10px] mt-0.5 ${job.escrow.status === "completed" ? "text-green-400" : "text-yellow-400"}`}>{job.escrow.status}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          <span className="font-mono">{role === "client" ? (job.freelancer || "N/A") : job.client}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                          <span>Completed</span>
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gold/10 pt-3 space-y-2">
                        <div className="text-[11px] text-muted-foreground">{ms.length} milestone{ms.length !== 1 ? "s" : ""}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ms.map((t: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gold/5 px-2.5 py-0.5 text-[10px] text-gold-soft">
                              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-gold/10 text-[8px] font-mono">{i + 1}</span>
                              {t}
                            </span>
                          ))}
                        </div>
                        {job.requirements && (
                          <div className="text-[11px] text-muted-foreground">
                            <FileText className="inline h-3 w-3 mr-1" />
                            Requirements: {job.requirements}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <img src={shieldImg} alt="" width={120} height={120} className="drop-shadow-[0_0_30px_oklch(0.68_0.07_175/0.6)]" />
          <div className="mt-4 font-display text-2xl text-marble">Completed Work</div>
          <div className="mt-1 text-xs uppercase tracking-[0.25em] text-gold-soft">On-chain record</div>
          <p className="mt-3 text-xs text-muted-foreground max-w-[200px]">
            Every completed milestone is permanently recorded on the GenLayer blockchain.
          </p>
        </div>
      }
    />
  );
}

function ReputationDemo() {
  const { account, connected } = useWallet();
  const [handle, setHandle] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState<"client" | "freelancer">("freelancer");
  const [regLoading, setRegLoading] = useState(false);
  const [regDone, setRegDone] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already registered on mount
  useEffect(() => {
    if (!account) { setChecking(false); return; }
    getPraetorScore(account).then((score) => {
      if (score > 0n) setRegDone(true);
    }).catch(() => {}).finally(() => setChecking(false));
  }, [account]);

  const trimmed = handle.trim();

  // Auto-load my profile after register check
  const [myProfile, setMyProfile] = useState<any>(null);
  useEffect(() => {
    if (!regDone || !account) return;
    getProfile(account).then(setMyProfile).catch(() => {});
  }, [regDone, account]);

  const lookup = async () => {
    if (!trimmed) return;
    setLoading(true);
    try {
      const p = await getProfile(trimmed);
      setProfile(p);
    } catch { setProfile(null); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!account || !regName.trim()) return;
    setRegLoading(true);
    try {
      const h = await registerUser(account, regName.trim(), regRole);
      await waitForReceipt(h);
      invalidateAllCache();
      setRegDone(true);
    } catch { /* */ }
    setRegLoading(false);
  };

  const ProfileCard = ({ p, address }: { p: any; address?: string }) => (
    <div className="rounded-xl border border-gold/20 bg-black/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Praetor Score</div>
          <div className="font-display text-3xl text-gold-gradient">{Number(p.praetor_score || 0n)}</div>
        </div>
        <span className="rounded-lg border border-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold-soft">{p.role}</span>
      </div>
      <div className="text-xs text-marble font-medium">{p.display_name}</div>
      {address && <div className="text-[10px] font-mono text-muted-foreground">{address.slice(0, 8)}…{address.slice(-6)}</div>}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-gold/5 p-2">
          <div className="text-muted-foreground">{p.role === "client" ? "Jobs posted" : "Jobs worked"}</div>
          <div className="text-marble font-medium">{Number(p.total_jobs || 0n)}</div>
        </div>
        <div className="rounded-lg bg-green-500/5 p-2">
          <div className="text-muted-foreground">{p.role === "client" ? "Paid" : "Completed"}</div>
          <div className="text-green-400 font-medium">{Number(p.completed_jobs || 0n)}</div>
        </div>
        <div className="rounded-lg bg-red-500/5 p-2">
          <div className="text-muted-foreground">Disputes</div>
          <div className="text-red-400 font-medium">{Number(p.disputed_jobs || 0n)}</div>
        </div>
        <div className="rounded-lg bg-gold/5 p-2">
          <div className="text-muted-foreground">Won disputes</div>
          <div className="text-gold-soft font-medium">{Number(p.won_disputes || 0n)}</div>
        </div>
      </div>
      {p.total_earned > 0n && <div className="text-xs text-muted-foreground">Total earned: <span className="text-gold-soft">{Number(p.total_earned) / 1e18} GEN</span></div>}
      {p.total_spent > 0n && <div className="text-xs text-muted-foreground">Total spent: <span className="text-gold-soft">{Number(p.total_spent) / 1e18} GEN</span></div>}
    </div>
  );

  return (
    <DemoShell
      title="Praetor Reputation Score"
      subtitle="Your on-chain reputation — completed jobs, dispute record, and overall Praetor score."
      left={
        <div className="space-y-4">
          {/* Register section */}
          {connected && !checking && !regDone && (
            <div className="rounded-xl border border-gold/20 p-4 space-y-3">
              <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Register your profile</div>
              <p className="text-xs text-muted-foreground">Create your on-chain Praetor identity to start building reputation.</p>
              <div className="flex gap-2">
                <input value={regName} onChange={(e) => setRegName(e.target.value)} className="input flex-1" placeholder="Display name" />
                <select value={regRole} onChange={(e) => setRegRole(e.target.value as any)} className="input w-28">
                  <option value="freelancer">Freelancer</option>
                  <option value="client">Client</option>
                </select>
                <button onClick={handleRegister} disabled={regLoading || !regName.trim()} className="btn-gold rounded-lg px-4 text-sm font-medium disabled:opacity-50">{regLoading ? "…" : "Register"}</button>
              </div>
            </div>
          )}
          {checking && <div className="text-xs text-muted-foreground text-center">Checking registration…</div>}

          {/* My profile */}
          {regDone && myProfile && account && (
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-gold-soft mb-2">My Profile</div>
              <ProfileCard p={myProfile} address={account} />
            </div>
          )}

          {/* Lookup other wallets */}
          <div className="rounded-xl border border-gold/15 bg-black/10 p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gold-soft">Look up another wallet</div>
            <div className="flex gap-2">
              <input value={handle} onChange={(e) => setHandle(e.target.value)} className="input flex-1 text-xs" placeholder="0x…" />
              <button onClick={lookup} disabled={!trimmed || loading} className="btn-ghost-gold rounded-lg px-3 text-xs font-medium">Look up</button>
            </div>
          </div>

          {profile ? (
            <ProfileCard p={profile} address={trimmed} />
          ) : trimmed && !loading ? (
            <div className="rounded-xl border border-gold/20 bg-black/20 p-4 text-center text-xs text-muted-foreground">
              <span className="font-mono text-gold-soft">{trimmed}</span> has no profile yet.
            </div>
          ) : null}
          {loading && <div className="text-xs text-muted-foreground text-center">Looking up…</div>}
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <img src={shieldImg} alt="" width={140} height={140} className="drop-shadow-[0_0_30px_oklch(0.68_0.07_175/0.6)]" />
          <div className="mt-4 font-display text-2xl text-marble">Laurel of Honor</div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Earned, never bought</div>
        </div>
      }
    />
  );
}
