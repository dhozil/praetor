import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-roman-ai.jpg";
import shieldImg from "@/assets/gold-shield.png";
import columnImg from "@/assets/column.jpg";
import {
  ShieldCheck,
  Sparkles,
  Scale,
  Lock,
  Star,
  FileSearch,
  Wallet,
  Coins,
  Cpu,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export const Route = createFileRoute("/")({
  component: PraetorLanding,
});

function PraetorLanding() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <CinematicBackground />
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Security />
      <Reputation />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function CinematicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[80vh] w-[70vw] -translate-x-1/2 rotate-6 bg-[radial-gradient(ellipse_at_top,oklch(0.82_0.15_82/0.18),transparent_60%)] blur-2xl animate-drift" />
      <div className="absolute top-1/3 -left-40 h-[60vh] w-[50vw] rotate-12 bg-[radial-gradient(ellipse_at_left,oklch(0.82_0.15_82/0.10),transparent_70%)] blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.09]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="oklch(0.82 0.15 82)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-gold animate-float-slow"
          style={{
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
            animationDelay: `${(i % 8) * 0.6}s`,
            animationDuration: `${6 + (i % 5)}s`,
            filter: "blur(0.5px)",
            boxShadow: "0 0 12px oklch(0.82 0.15 82 / 0.9)",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0.08_0.004_60)_100%)]" />
    </div>
  );
}

function Nav() {
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it Works" },
    { href: "#security", label: "Security" },
    { href: "#reputation", label: "Reputation" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="fixed top-4 left-1/2 z-50 w-[min(1200px,95%)] -translate-x-1/2 rounded-full glass-card px-5 py-3">
      <div className="flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <img src={shieldImg} alt="" width={28} height={28} className="drop-shadow-[0_0_10px_oklch(0.82_0.15_82/0.6)]" />
          <span className="font-display text-xl tracking-wide text-gold-gradient">PRAETOR</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ConnectWalletButton variant="ghost" />
          <Link to="/features" className="btn-gold rounded-full px-5 py-2 text-sm font-medium hover:[&]:btn-gold-hover">
            Launch App
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative pt-40 pb-32">
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="" width={1920} height={1280} className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-soft animate-fade-up">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-gold" />
          Built on GenLayer Intelligent Contracts
        </div>

        <h1 className="animate-fade-up font-display text-6xl leading-[1.02] tracking-tight md:text-8xl" style={{ animationDelay: "0.1s" }}>
          <span className="text-gold-gradient">Justice</span>
          <br />
          <span className="text-marble">for Digital Work</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl animate-fade-up text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "0.25s" }}>
          AI-powered escrow built on GenLayer Intelligent Contracts. Milestones verified by evidence. Payments released automatically. Disputes judged fairly.
        </p>

        <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-4" style={{ animationDelay: "0.4s" }}>
          <button className="btn-gold group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-medium hover:[&]:btn-gold-hover">
            Start an Escrow
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="btn-ghost-gold rounded-full px-7 py-3.5 font-medium hover:bg-gold/10">
            Read the Manifesto
          </button>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl animate-fade-up grid-cols-1 gap-6 md:grid-cols-3" style={{ animationDelay: "0.55s" }}>
          {[
            { k: "$0", v: "Middlemen" },
            { k: "24/7", v: "AI Verification" },
            { k: "100%", v: "On-Chain Audit" },
          ].map((s) => (
            <div key={s.v} className="glass-card rounded-2xl px-6 py-8 text-left">
              <div className="font-display text-4xl text-gold-gradient">{s.k}</div>
              <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["GITHUB", "LIVE WEBSITE", "FIGMA", "DOCUMENTATION", "DEMO VIDEO", "SCREENSHOTS", "IPFS PROOF", "ON-CHAIN LOG"];
  return (
    <section className="relative py-12">
      <div className="hairline mx-auto max-w-6xl" />
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span className="text-gold-soft">Evidence Accepted:</span>
        {items.map((i) => (<span key={i}>{i}</span>))}
      </div>
      <div className="hairline mx-auto mt-8 max-w-6xl" />
    </section>
  );
}

const featureList = [
  { icon: ShieldCheck, title: "AI Escrow", desc: "Funds are locked in an Intelligent Contract the moment the job begins." },
  { icon: FileSearch, title: "Milestone Verification", desc: "AI inspects repos, deployments, Figma, docs and demos against requirements." },
  { icon: Coins, title: "Automatic Payment Release", desc: "Once evidence passes, the contract releases the payment instantly." },
  { icon: Scale, title: "Dispute Resolution", desc: "GenLayer validators evaluate both sides using natural-language reasoning." },
  { icon: Star, title: "Reputation Score", desc: "Every completed milestone builds a portable, on-chain reputation." },
  { icon: Lock, title: "Audit Trail", desc: "Every decision, hash and payout is permanently recorded on-chain." },
];

function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader eyebrow="Features" title="An empire of trust, engineered." subtitle="Every tool a Praetor needs to judge digital work — fairly, quickly, autonomously." />
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureList.map((f) => (
            <Link
              key={f.title}
              to="/features"
              className="glass-card group relative block overflow-hidden rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-1"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/5 text-gold">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl text-marble">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-gold-soft opacity-0 transition-opacity group-hover:opacity-100">
                Try it <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "I", title: "Client creates a job", desc: "The client defines milestones and deposits funds into the Intelligent Contract.", icon: Wallet },
  { n: "II", title: "Freelancer accepts", desc: "The freelancer reviews the terms and locks in the engagement on-chain.", icon: ShieldCheck },
  { n: "III", title: "Evidence is submitted", desc: "Links to GitHub, Figma, live URL, docs, demo video or screenshots are attached.", icon: FileSearch },
  { n: "IV", title: "AI evaluates", desc: "GenLayer validators reason about the requirements against the delivered evidence.", icon: Cpu },
  { n: "V", title: "Payment or dispute", desc: "If passed, funds release automatically. If disputed, the contract judges both sides.", icon: Scale },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader eyebrow="How it Works" title="From denarii to deliverables." subtitle="A five-step ritual that turns freelance work into verifiable, auto-settled trade." />
        <div className="relative mt-20 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <div className="relative hidden lg:block">
            <img src={columnImg} alt="" width={280} height={460} loading="lazy" className="sticky top-32 w-full rounded-3xl border border-gold/20 object-cover shadow-glass" />
          </div>
          <ol className="relative space-y-6 lg:pl-8">
            {steps.map((s) => (
              <li key={s.n} className="glass-card relative flex items-start gap-6 rounded-2xl p-6 md:p-8">
                <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full border border-gold/40 bg-background font-display text-xl text-gold-gradient">
                  {s.n}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <s.icon className="h-4 w-4 text-gold" />
                    <h3 className="text-2xl text-marble">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Security() {
  const pillars = [
    { icon: Lock, title: "Non-custodial by design", desc: "Funds live inside the Intelligent Contract. Praetor never holds your assets." },
    { icon: Sparkles, title: "Verifiable AI reasoning", desc: "Every AI judgment is signed by validators and recorded immutably." },
    { icon: FileSearch, title: "IPFS evidence", desc: "Deliverables are pinned to IPFS — tamper-evident, permanently referenceable." },
    { icon: Wallet, title: "Wallet-native login", desc: "Connect MetaMask, Rabby, Coinbase Wallet, Rainbow, Trust — any EVM wallet via EIP-6963." },
  ];
  return (
    <section id="security" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader align="left" eyebrow="Security" title="Guarded like the imperial vault." subtitle="Every layer of Praetor is designed so no single party — not even us — can bend the outcome." />
            <div className="mt-10 space-y-4">
              {pillars.map((p) => (
                <div key={p.title} className="glass-card flex items-start gap-4 rounded-xl p-5">
                  <div className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-gold/30 bg-gold/5 text-gold">
                    <p.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-marble">{p.title}</div>
                    <div className="text-sm text-muted-foreground">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-card mx-auto aspect-square w-full max-w-md rounded-full p-10">
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-gold/30">
                <div className="absolute inset-4 rounded-full border border-gold/20 animate-pulse-gold" />
                <div className="absolute inset-10 rounded-full border border-gold/10" />
                <img src={shieldImg} alt="Praetor gold shield emblem" width={220} height={220} loading="lazy" className="drop-shadow-[0_0_40px_oklch(0.82_0.15_82/0.6)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reputation() {
  return (
    <section id="reputation" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader eyebrow="Reputation" title="Honor, quantified." subtitle="Every milestone verified by Praetor mints a permanent mark on your on-chain reputation." />
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { name: "Marcus A.", role: "Full-stack Engineer", score: 987 },
            { name: "Livia S.", role: "Product Designer", score: 942 },
            { name: "Cassius R.", role: "Smart Contract Dev", score: 998 },
          ].map((u) => (
            <div key={u.name} className="glass-card relative rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-gold-gradient">
                    {u.name[0]}
                  </div>
                  <div>
                    <div className="text-marble">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.role}</div>
                  </div>
                </div>
                <Star className="h-4 w-4 fill-gold text-gold" />
              </div>

              <div className="mt-8">
                <div className="font-display text-5xl text-gold-gradient">{u.score}</div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Praetor Score</div>
              </div>

              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold" style={{ width: `${(u.score / 1000) * 100}%` }} />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <div><div className="text-marble">142</div>Jobs</div>
                <div><div className="text-marble">100%</div>On-time</div>
                <div><div className="text-marble">0</div>Disputes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "What is a GenLayer Intelligent Contract?", a: "A smart contract that can reason with natural language and access web data through validator consensus — allowing on-chain logic to evaluate real-world evidence like a URL or a GitHub repo." },
    { q: "How does Praetor decide if a milestone passes?", a: "The client's requirements and the freelancer's submitted evidence are both passed to the Intelligent Contract. GenLayer validators independently reason about them; their consensus determines the outcome." },
    { q: "What happens to my funds during the job?", a: "Funds are locked inside the Intelligent Contract. Praetor is non-custodial — we never hold or move your assets ourselves." },
    { q: "Which chains are supported?", a: "Praetor launches on the GenLayer network. Multi-chain payments are on the roadmap." },
    { q: "Do I need a wallet?", a: "Yes. Connect any EVM wallet — MetaMask, Rabby, Coinbase Wallet, Rainbow, Trust — to create jobs, accept work, or submit evidence. GEN is used for escrow." },
  ];
  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader eyebrow="FAQ" title="Consilium — the questions of the forum." />
        <Accordion type="single" collapsible className="mt-12 space-y-4">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="glass-card rounded-xl border-0 px-6">
              <AccordionTrigger className="py-5 text-left font-display text-lg text-marble hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="glass-card relative overflow-hidden rounded-3xl px-8 py-20 text-center md:px-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.82_0.15_82/0.18),transparent_70%)]" />
          <img src={shieldImg} alt="" width={80} height={80} loading="lazy" className="mx-auto mb-6 drop-shadow-[0_0_20px_oklch(0.82_0.15_82/0.6)]" />
          <h2 className="font-display text-4xl md:text-6xl">
            <span className="text-marble">Enter the </span>
            <span className="text-gold-gradient">Forum.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Deposit funds, submit evidence, and let Intelligent Contracts do the judging. No middlemen. No delays. No doubt.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button className="btn-gold rounded-full px-7 py-3.5 font-medium hover:[&]:btn-gold-hover">Launch Praetor</button>
            <button className="btn-ghost-gold rounded-full px-7 py-3.5 font-medium hover:bg-gold/10">View Documentation</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-gold/10 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={shieldImg} alt="" width={28} height={28} loading="lazy" />
            <span className="font-display text-xl text-gold-gradient">PRAETOR</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            AI-powered escrow built on GenLayer Intelligent Contracts. Justice for digital work — from the first commit to the final payout.
          </p>
        </div>
        <FooterCol title="Product" items={["Features", "How it Works", "Security", "Reputation"]} />
        <FooterCol title="Resources" items={["Documentation", "GenLayer", "GitHub", "Contact"]} />
      </div>
      <div className="hairline mx-auto mt-12 max-w-6xl" />
      <div className="mx-auto mt-6 flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-xs text-muted-foreground md:flex-row">
        <div>© {new Date().getFullYear()} Praetor. Senatus Populusque Digitalis.</div>
        <div className="tracking-[0.3em] uppercase">S · P · Q · D</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-3 text-xs uppercase tracking-[0.25em] text-gold-soft">{title}</div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}><a href="#" className="transition-colors hover:text-foreground">{i}</a></li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${a} max-w-2xl`}>
      <div className="mb-4 text-xs uppercase tracking-[0.3em] text-gold-soft">— {eyebrow}</div>
      <h2 className="font-display text-4xl leading-tight md:text-5xl">
        <span className="text-marble">{title}</span>
      </h2>
      {subtitle && <p className="mt-4 text-muted-foreground md:text-lg">{subtitle}</p>}
    </div>
  );
}
