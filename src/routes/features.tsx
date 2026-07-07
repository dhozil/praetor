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
  getClientJobs,
  getFreelancerJobs,
  getEscrow,
  verifyMilestone,
  getVerification,
  releasePayment,
  openDispute,
  waitForReceipt,
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
  const wallet = connected;
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

  const validMs = msTitles.filter((m) => m.trim().length > 0);
  const totalBudget = parseFloat(budget) || 0;
  const canPost = title.trim() && desc.trim() && validMs.length > 0 && totalBudget > 0 && connected;

  const handlePost = async () => {
    if (!canPost || !account || !wallet?.provider) return;
    setPosting(true);
    try {
      const amountWei = BigInt(Math.round(totalBudget * 10 ** 18));
      const perMs = amountWei / BigInt(validMs.length);
      const txHash = await postJob(account, wallet.provider, {
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
      invalidateMarketplaceCache();
      await refresh();
    } catch { /* tx failed */ }
    setPosting(false);
  };

  const handleApply = async (jobId: bigint) => {
    if (!account || !wallet?.provider) return;
    setApplyLoading(jobId);
    try {
      const txHash = await applyJob(account, wallet.provider, jobId);
      await waitForReceipt(txHash);
      invalidateMarketplaceCache();
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
                <input type="number" step="any" value={budget} onChange={(e) => { const v = e.target.value; setBudget(v === "" ? "" : v); }} className="input" placeholder="e.g. 5000" />
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
                                        onClick={() => assignFreelancer(account!, wallet!.provider, id, a).then(() => refresh())}
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
                                await assignFreelancer(account!, wallet!.provider, id, addr);
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
  const wallet = connected;
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [jobIds, setJobIds] = useState<bigint[]>([]);
  const [jobs, setJobs] = useState<Map<string, any>>(new Map());
  const [escrows, setEscrows] = useState<Map<string, any>>(new Map());
  const [applicants, setApplicants] = useState<Map<string, string[]>>(new Map());
  const [expanded, setExpanded] = useState<bigint | null>(null);

  const refresh = async () => {
    if (!account) return;
    try {
      const fetchFn = role === "client" ? getClientJobs : getFreelancerJobs;
      const ids = await fetchFn(account);
      setJobIds(ids);
      const jm = new Map(jobs);
      const em = new Map(escrows);
      const ap = new Map(applicants);
      for (const id of ids) {
        if (!jm.has(id.toString())) {
          try {
            const job = await getJob(id);
            jm.set(id.toString(), job);
            if (job.status === "assigned") {
              try {
                const escrow = await getEscrow(id);
                if (escrow) em.set(id.toString(), escrow);
              } catch { /* no escrow yet */ }
            }
            if (job.status === "open") {
              try {
                const apps = await getApplicants(id);
                if (apps.length > 0) ap.set(id.toString(), apps);
              } catch { /* */ }
            }
          } catch { /* skip */ }
        }
      }
      setJobs(jm);
      setEscrows(em);
      setApplicants(ap);
    } catch { /* no contract */ }
  };

  useEffect(() => { refresh(); }, [account, role]);

  if (!connected) return <EmptyState text="Connect wallet to see your dashboard." />;

  return (
    <DemoShell
      title={role === "client" ? "Jobs you posted" : "Jobs you're working on"}
      subtitle="View all your active and completed jobs."
      left={
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setRole("client")} className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${role === "client" ? "btn-gold text-primary-foreground" : "border border-gold/20 text-muted-foreground hover:bg-gold/5"}`}>
              <Briefcase className="mx-auto mb-0.5 h-3.5 w-3.5" /> As Client
            </button>
            <button onClick={() => setRole("freelancer")} className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${role === "freelancer" ? "btn-gold text-primary-foreground" : "border border-gold/20 text-muted-foreground hover:bg-gold/5"}`}>
              <UserCheck className="mx-auto mb-0.5 h-3.5 w-3.5" /> As Freelancer
            </button>
          </div>

          <button onClick={refresh} className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-foreground">
            <ExternalLink className="h-3 w-3" /> Refresh
          </button>

          {jobIds.length === 0 ? (
            <EmptyState text={role === "client" ? "You haven't posted any jobs yet." : "No jobs assigned to you yet. Browse Marketplace to apply."} />
          ) : (
            <div className="rounded-xl border border-gold/20 divide-y divide-gold/10 text-xs">
              {jobIds.map((id) => {
                const job = jobs.get(id.toString());
                const escrow = escrows.get(id.toString());
                return (
                  <div key={id.toString()}>
                    <button
                      onClick={() => setExpanded(expanded === id ? null : id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gold/5 transition-colors"
                    >
                      <span className="font-mono text-gold-soft shrink-0">#{id.toString()}</span>
                      <span className="flex-1 truncate text-marble font-medium">{job?.title || "…"}</span>
                      <Badge status={job?.status || "open"} />
                      {role === "client" && job?.status === "open" && applicants.has(id.toString()) && (
                        <span className="shrink-0 text-gold-soft text-[10px]">{applicants.get(id.toString())?.length || 0} applicant{(applicants.get(id.toString())?.length || 0) !== 1 ? "s" : ""}</span>
                      )}
                      {escrow && <span className={escrow.status === "active" ? "text-green-400" : "text-muted-foreground"}>{escrow.milestones?.filter((m: any) => m.verified).length || 0}/{escrow.milestones?.length || 0}</span>}
                    </button>
                    {expanded === id && job && (
                      <div className="px-3 pb-3 space-y-2 text-xs">
                        <p className="text-marble">{job.description}</p>
                        <div className="flex gap-4 text-muted-foreground">
                          <span>Budget: <span className="text-gold-soft">{Number(job.total_budget) / 1e18} GEN</span></span>
                          <span>Status: <Badge status={job.status} /></span>
                          {job.assigned_freelancer && job.assigned_freelancer !== "0x0000000000000000000000000000000000000000" && (
                            <span>Freelancer: <span className="font-mono text-marble">{job.assigned_freelancer.slice(0, 6)}…{job.assigned_freelancer.slice(-4)}</span></span>
                          )}
                        </div>
                        {escrow && (
                          <div className="rounded-lg border border-gold/15 bg-black/20 p-3 space-y-1">
                            <div className="text-gold-soft uppercase tracking-wider text-[10px]">Escrow</div>
                            {escrow.milestones?.map((ms: any, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-marble">{ms.title || `Milestone ${i + 1}`}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{Number(ms.amount) / 1e18} GEN</span>
                                  <Badge status={ms.status} />
                                  {ms.ai_score > 0 && <span className="text-gold-soft">{ms.ai_score}/100</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Applicants for client open jobs */}
                        {role === "client" && job.status === "open" && applicants.has(id.toString()) && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-2">Applicants ({applicants.get(id.toString())?.length || 0})</div>
                            <div className="space-y-1.5">
                              {applicants.get(id.toString())?.map((a: string) => (
                                <div key={a} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2 font-mono text-marble">
                                    <UserCheck className="h-3.5 w-3.5 text-gold-soft" />
                                    <span>{a.slice(0, 8)}…{a.slice(-6)}</span>
                                  </div>
                                  <button
                                    onClick={() => assignFreelancer(account!, wallet!.provider, id, a).then(() => refresh())}
                                    className="rounded-lg border border-gold/20 px-3 py-1 text-gold-soft hover:bg-gold/5 text-[11px] font-medium"
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
  const wallet = connected;

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
        const list: any[] = [];
        for (const id of ids) {
          try {
            const job = await getJob(id);
            if (job.status === "assigned") {
              const escrow = await getEscrow(id);
              list.push({
                jobId: id,
                title: job.title,
                jobDescription: escrow?.job_description || job.description || "",
                milestones: escrow?.milestones || job.milestone_titles?.map((t: string, i: number) => ({
                  title: t,
                  description: job.milestone_descriptions?.[i] || "",
                  amount: job.milestone_amounts?.[i] || 0n,
                  status: "pending",
                })) || [],
              });
            }
          } catch { /* */ }
        }
        setMyEscrows(list);
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
    if (!account || !wallet?.provider || items.length === 0) return;
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
      const txHash = await verifyMilestone(account, wallet.provider, {
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

            {myEscrows.length > 0 ? (
              <select
                value={escrowId}
                onChange={(e) => {
                  const val = e.target.value;
                  setEscrowId(val);
                  if (val) {
                    const entry = myEscrows.find((x) => x.jobId.toString() === val);
                    if (entry) {
                      setJobDescription(entry.jobDescription || "");
                      setMilestoneIndex("0");
                      if (entry.milestones?.length > 0) {
                        const ms = entry.milestones[0];
                        setMilestoneTitle(ms.title || "");
                        setMilestoneDescription(ms.description || "");
                      }
                    }
                  }
                }}
                className="input w-full text-sm"
              >
                <option value="">— Select escrow —</option>
                {myEscrows.map((e) => (
                  <option key={e.jobId.toString()} value={e.jobId.toString()}>
                    #{e.jobId.toString()} — {e.title} ({e.milestones?.length || 0} ms)
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  value={escrowId}
                  onChange={(e) => setEscrowId(e.target.value)}
                  className="input flex-1 font-mono"
                  placeholder="Escrow ID (manual)"
                />
                <button onClick={() => loadEscrow()} className="btn-ghost-gold rounded-lg px-3 text-xs hover:bg-gold/10">Load</button>
              </div>
            )}

            {escrowId && (
              <>
                {/* Milestone picker */}
                {myEscrows.find((e) => e.jobId.toString() === escrowId)?.milestones?.length > 1 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gold-soft mb-1">2. Select milestone</div>
                    <select
                      value={milestoneIndex}
                      onChange={(e) => {
                        const idx = e.target.value;
                        setMilestoneIndex(idx);
                        const entry = myEscrows.find((x) => x.jobId.toString() === escrowId);
                        if (entry?.milestones?.[parseInt(idx)]) {
                          const ms = entry.milestones[parseInt(idx)];
                          setMilestoneTitle(ms.title || "");
                          setMilestoneDescription(ms.description || "");
                        }
                      }}
                      className="input w-full text-sm"
                    >
                      {myEscrows
                        .find((e) => e.jobId.toString() === escrowId)
                        ?.milestones?.map((ms: any, i: number) => (
                          <option key={i} value={i.toString()}>
                            Milestone {i + 1}: {ms.title} ({Number(ms.amount) / 1e18} GEN) — {ms.status}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

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
            </div>
          )}

          {!connected && <div className="rounded-lg border border-gold/20 bg-gold/5 p-2 text-xs text-gold-soft text-center">Connect wallet to verify</div>}

          <button onClick={verify} disabled={!canVerify || state === "verifying"}
            className="btn-gold w-full rounded-full py-3.5 font-medium hover:[&]:btn-gold-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
  const wallet = connected;
  const [escrowId, setEscrowId] = useState("");
  const [milestoneIndex, setMilestoneIndex] = useState("0");
  const [stage, setStage] = useState<"idle" | "releasing" | "released" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const release = async () => {
    if (!account || !wallet?.provider) return;
    setStage("releasing");
    setErrorMsg("");
    try {
      const txHash = await releasePayment(account, wallet.provider, BigInt(escrowId), BigInt(milestoneIndex));
      await waitForReceipt(txHash);
      setStage("released");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Release failed");
      setStage("error");
    }
  };

  return (
    <DemoShell
      title="Release milestone payment"
      subtitle="Only the client can release. The milestone must be verified first."
      left={
        <div className="space-y-4">
          <div className="rounded-xl border border-gold/20 p-4 space-y-2">
            <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Release funds</div>
            <div className="flex gap-2">
              <input value={escrowId} onChange={(e) => setEscrowId(e.target.value)} className="input flex-1" placeholder="Escrow ID" />
              <input value={milestoneIndex} onChange={(e) => setMilestoneIndex(e.target.value)} className="input w-20" placeholder="MS #" />
            </div>
          </div>

          {!connected && <div className="rounded-lg border border-gold/20 bg-gold/5 p-2 text-xs text-gold-soft text-center">Connect wallet to release</div>}

          <button onClick={release} disabled={!escrowId.trim() || !connected || stage === "releasing"}
            className="btn-gold w-full rounded-full py-3.5 font-medium hover:[&]:btn-gold-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stage === "released" ? "✓ Payment released" : stage === "releasing" ? "Releasing…" : stage === "error" ? "Retry" : "Release payment"}
          </button>

          {stage === "released" && <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-marble">Payment released to freelancer.</div>}
          {errorMsg && <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{errorMsg}</div>}
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
  const wallet = connected;
  const [escrowId, setEscrowId] = useState("");
  const [milestoneIdx, setMilestoneIdx] = useState("");
  const [client, setClient] = useState("");
  const [freelancer, setFreelancer] = useState("");
  const [phase, setPhase] = useState<"idle" | "voting" | "verdict">("idle");
  const [votes, setVotes] = useState<Array<"client" | "freelancer" | "pending">>(Array(5).fill("pending"));
  const [txError, setTxError] = useState("");

  const canJudge = escrowId.trim().length > 0 && milestoneIdx.trim().length >= 0 && client.trim().length > 0 && freelancer.trim().length > 0 && connected;

  const judge = async () => {
    if (!canJudge || !account || !wallet?.provider) return;
    setTxError("");
    setPhase("voting");
    setVotes(Array(5).fill("pending"));
    try {
      const txHash = await openDispute(account, wallet.provider, BigInt(escrowId), BigInt(milestoneIdx || "0"), client, [], freelancer, []);
      await waitForReceipt(txHash);
      const bias = client.length / (client.length + freelancer.length);
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          setVotes((v) => {
            const c = [...v];
            const seed = (client.charCodeAt(i % client.length) + freelancer.charCodeAt(i % freelancer.length) + i) % 100;
            c[i] = seed / 100 < bias ? "client" : "freelancer";
            return c;
          });
        }, 700 + i * 500);
      }
      setTimeout(() => setPhase("verdict"), 4200);
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Transaction failed";
      setTxError(msg.includes("reverted") ? msg : `Transaction reverted: ${msg}`);
      setPhase("idle");
    }
  };

  const freelancerWins = votes.filter((v) => v === "freelancer").length;
  const clientWins = votes.filter((v) => v === "client").length;

  return (
    <DemoShell
      title="Dispute resolution by AI jury"
      subtitle="Five validators independently reason about both statements and vote. AI resolves the final verdict."
      left={
        <div className="space-y-4">
          <div className="flex gap-2">
            <Field label="Escrow ID">
              <input type="number" step="1" value={escrowId} onChange={(e) => setEscrowId(e.target.value)} className="input" placeholder="Escrow ID" />
            </Field>
            <Field label="Milestone">
              <input type="number" step="1" value={milestoneIdx} onChange={(e) => setMilestoneIdx(e.target.value)} className="input w-20" placeholder="0" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Client's statement">
              <textarea value={client} onChange={(e) => setClient(e.target.value)} rows={4} placeholder="Explain the client's position…" className="input resize-none" />
            </Field>
            <Field label="Freelancer's statement">
              <textarea value={freelancer} onChange={(e) => setFreelancer(e.target.value)} rows={4} placeholder="Explain the freelancer's position…" className="input resize-none" />
            </Field>
          </div>

          <button
            onClick={() => {
              const examples = [
                { escrowId: "0", milestoneIdx: "0", client: "The freelancer delivered the DeFi dashboard a week late and the wallet connect feature doesn't work with Ledger. I paid 0.6 GEN upfront and expected a working product. He refuses to fix the bugs unless I pay more.", freelancer: "I completed all 4 milestones on time. The client kept adding extra features mid-project and now blames me for scope creep. The Ledger issue is a known browser limitation, not a bug. I offered to fix it for an additional 0.1 GEN since it was out of scope." },
                { escrowId: "1", milestoneIdx: "2", client: "I hired him for a smart contract audit. The report only found 2 issues when we later discovered 7 critical vulnerabilities. The audit was incomplete and I had to pay another auditor 0.5 GEN to redo the work. He refuses a refund.", freelancer: "The contract was 95% complete when I received it. I explicitly stated my audit scope was limited to the Solidity code provided. The client later added new modules that I never reviewed. My report clearly stated the scope limitations." },
                { escrowId: "2", milestoneIdx: "1", client: "He built an NFT minting page but the gas estimation is completely wrong — users overpay by 3x on every mint. I asked for a fix 2 weeks ago and he keeps saying 'next week'. I want the milestone payment of 0.2 GEN returned.", freelancer: "I provided a working gas estimation module. The client deployed it with a different provider configuration that broke the estimates. I've offered 3 times to fix the configuration but the client won't share their deployment setup for debugging." },
                { escrowId: "3", milestoneIdx: "0", client: "The AI chatbot integration was supposed to support GPT-4 but the delivered version only uses GPT-3.5. The response quality is noticeably worse and users are complaining. I paid 0.8 GEN for premium integration.", freelancer: "The project specification said 'LLM API integration' without specifying the model tier. GPT-4 costs 20x more per token. I built the integration to use whatever model the API key has access to. The client uses a free-tier key that only allows GPT-3.5." },
                { escrowId: "4", milestoneIdx: "3", client: "The DAO governance dApp has a critical bug: proposal votes aren't counted correctly when quorum is reached on the last day. We lost a $10k treasury vote because of this. The freelancer blames the testing environment.", freelancer: "I delivered the code with full test coverage and a working demo on the testnet. The client modified the voting parameters after deployment without updating the quorum calculation. I can provide git history showing the client's changes broke the logic." },
              ];
              const pick = examples[Math.floor(Math.random() * examples.length)];
              setEscrowId(pick.escrowId);
              setMilestoneIdx(pick.milestoneIdx);
              setClient(pick.client);
              setFreelancer(pick.freelancer);
            }}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/20 px-3 py-1.5 text-xs text-gold-soft hover:bg-gold/5 hover:text-foreground transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" /> Random fill example
          </button>

          <button onClick={judge} disabled={!canJudge || phase === "voting"}
            className="btn-gold w-full rounded-full py-3.5 font-medium hover:[&]:btn-gold-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === "voting" ? "Jury deliberating…" : phase === "verdict" ? "Verdict rendered" : !connected ? "Connect wallet first" : canJudge ? "Convene the jury" : "Fill all fields"}
          </button>

          {txError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{txError}</div>
          )}

          <div className="rounded-xl border border-gold/20 p-4">
            <div className="mb-4 text-xs uppercase tracking-[0.25em] text-gold-soft">Validator jury (5 seats)</div>
            <div className="flex justify-around">
              {votes.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`grid h-14 w-14 place-items-center rounded-full border transition-all ${
                    v === "pending" ? "border-gold/20 text-muted-foreground" :
                    v === "freelancer" ? "border-gold/60 bg-gold/15 text-marble" :
                    "border-destructive/50 bg-destructive/10 text-destructive"
                  }`}>
                    {v === "pending" ? <Sparkles className="h-5 w-5 animate-pulse" /> :
                     v === "freelancer" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">V{i + 1}</div>
                </div>
              ))}
            </div>
            {phase === "verdict" && (
              <div className="mt-6 text-center">
                <div className="font-display text-2xl text-gold-gradient">
                  Verdict: {freelancerWins > clientWins ? "Freelancer" : "Client"} wins ({Math.max(freelancerWins, clientWins)}/5)
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Funds released according to the majority reasoning.</p>
              </div>
            )}
          </div>
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center text-center">
          <RomanCandle active={phase === "voting"} durationMs={4200} label="Jury reasoning" size="lg" />
          <div className="mt-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {phase === "voting" ? "Validators deliberating" : phase === "verdict" ? "Verdict rendered" : "Awaiting dispute"}
          </div>
        </div>
      }
    />
  );
}

// ─── 6. Reputation ──────────────────────────────────────────────────────────

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
      const list: any[] = [];
      for (const id of ids) {
        try {
          const job = await getJob(id);
          if (job.status === "completed") {
            let escrow = null;
            try {
              escrow = await getEscrow(id);
            } catch {}
            list.push({ ...job, jobId: id, escrow });
          }
        } catch {}
      }
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
  const [handle, setHandle] = useState("");
  const trimmed = handle.trim();
  const hasHandle = trimmed.length > 0;

  return (
    <DemoShell
      title="Praetor Reputation Score"
      subtitle="Every completed milestone mints an on-chain badge. Look up any wallet to see their record."
      left={
        <div className="space-y-4">
          <Field label="Wallet or ENS handle">
            <div className="flex gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/5 text-gold"><Wallet className="h-4 w-4" /></span>
              <input value={handle} onChange={(e) => setHandle(e.target.value)} className="input flex-1" placeholder="0x… or yourname.eth" />
            </div>
          </Field>
          {!hasHandle ? (
            <EmptyState text="Enter a wallet or ENS handle to look up its on-chain reputation." />
          ) : (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-gold-soft">Praetor Score</div>
                  <div className="font-display text-4xl text-muted-foreground">Not indexed yet</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-mono text-gold-soft">{trimmed}</span> has no completed jobs recorded on Praetor.
              </p>
            </div>
          )}
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
