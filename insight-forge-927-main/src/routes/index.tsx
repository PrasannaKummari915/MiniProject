import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquare, Sparkles, ChevronUp, History, Map, BarChart3, Bot } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FeatureFlow AI — Turn user feedback into product innovation" },
      {
        name: "description",
        content:
          "Collect feature requests, prioritize ideas with AI, and ship what users truly want. Real-time voting, public roadmap, smart insights.",
      },
      { property: "og:title", content: "FeatureFlow AI" },
      {
        property: "og:description",
        content:
          "AI-powered feature request & voting platform. Centralize feedback, automate triage, ship faster.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border glass">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-6 bg-foreground rounded-sm grid place-items-center">
              <div className="size-2 bg-background rotate-45" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">FeatureFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#roadmap" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Roadmap</a>
            <a href="#ai" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Intelligence</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="px-3 py-1.5 text-sm font-medium hover:bg-secondary rounded-md transition-colors">Sign in</Link>
            <Link to="/auth" className="px-3 py-1.5 text-sm font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity shadow-sm">Get started</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hero copy */}
          <div className="animate-reveal">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-accent border border-accent-foreground/10 mb-6">
              <span className="flex size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-accent-foreground">Intelligence v2.4 Live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-balance leading-[0.95] mb-6">
              Turn User Feedback Into <span className="text-primary">Innovation</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-[48ch] text-pretty mb-10">
              Centralize every feature request. Automate the noise. Deliver what actually moves the
              needle with AI-powered prioritization.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3.5 bg-foreground text-background font-medium rounded-lg hover:shadow-elevated hover:-translate-y-0.5 transition-all">
                Submit Idea <ArrowRight className="size-4" />
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3.5 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition-colors">
                Explore Features
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span>2.4k Teams</span>
              <span className="text-border">/</span>
              <span>180k Requests</span>
              <span className="text-border">/</span>
              <span>94% Accuracy</span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative animate-reveal [animation-delay:200ms]">
            <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] -z-10 blur-2xl" />
            <div className="bg-card border border-border rounded-xl shadow-elevated overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/50 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-border" />
                  <div className="size-2.5 rounded-full bg-border" />
                  <div className="size-2.5 rounded-full bg-border" />
                </div>
                <div className="px-3 py-1 rounded-md border border-border bg-background text-[10px] font-mono">
                  workspace/feature-flow-ai
                </div>
              </div>

              <div className="p-6 space-y-4">
                <PreviewCard
                  status="In Progress"
                  statusCls="bg-warning/10 text-warning border-warning/30"
                  id="FF-102"
                  title="Voice Feedback Capture"
                  body="Allow users to record and transcribe audio requests directly..."
                  votes={142}
                  comments={12}
                  active
                />
                <div className="relative">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-full" />
                  <div className="bg-primary/[0.04] border border-primary/15 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-primary italic">AI INSIGHT</span>
                      <div className="h-px flex-1 bg-primary/10" />
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80 italic">
                      "38% of enterprise customers mentioned 'Dark Mode' in the last 48 hours.
                      Recommend escalating priority to <span className="font-bold not-italic">Critical</span>."
                    </p>
                  </div>
                </div>
                <PreviewCard
                  status="Planned"
                  statusCls="bg-info/10 text-info border-info/20"
                  id="FF-101"
                  title="AI Duplicate Detection"
                  votes={89}
                />
              </div>

              <div className="p-4 border-t border-border bg-secondary/50 flex gap-2">
                <KanbanMini label="Backlog (42)" pct={25} muted />
                <KanbanMini label="Live (12)" pct={80} />
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <section id="features" className="mt-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight max-w-[20ch]">
              Built for high-growth product teams
            </h2>
            <p className="text-muted-foreground max-w-[40ch]">
              Tools to help you stop guessing and start building what users actually want.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="p-7 border border-border rounded-xl bg-secondary/30 hover:border-foreground/20 transition-colors"
              >
                <div className="size-10 bg-card border border-border rounded-lg flex items-center justify-center mb-6 shadow-sm">
                  <f.icon className="size-5 text-primary" />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mb-2">
                  0{i + 1}
                </div>
                <h4 className="text-lg font-bold mb-2">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Velocity engine */}
        <section id="ai" className="mt-32 border border-border rounded-2xl p-8 md:p-12 bg-secondary/40 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.06] pointer-events-none">
            <div className="font-display text-[200px] leading-none font-bold tracking-tighter">FLOW</div>
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="text-primary font-mono text-xs font-bold uppercase tracking-widest mb-4">
              Velocity Engine
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-6">
              Ship with certainty.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our proprietary scoring model combines vote volume, sentiment urgency, and strategic
              alignment into a single 'Build Score'.
            </p>
            <div className="flex items-center gap-12">
              <div>
                <div className="text-3xl font-display font-bold">94%</div>
                <div className="text-xs text-muted-foreground uppercase font-mono mt-1">Accuracy</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-3xl font-display font-bold">2.4x</div>
                <div className="text-xs text-muted-foreground uppercase font-mono mt-1">Speed-to-Market</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-32 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Ready to listen better?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join 2,400+ product teams building with their users — not for them.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-foreground text-background font-medium rounded-lg hover:shadow-elevated hover:-translate-y-0.5 transition-all"
          >
            Get started free <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-5 bg-foreground rounded-sm" />
            <span className="font-display font-bold">FeatureFlow AI</span>
          </div>
          <div className="flex gap-6 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              Status: Operational
            </span>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Bot, title: "AI Duplicate Detection", body: "Automatically cluster similar feedback threads with semantic vector search. Keep your roadmap clean without manual triage." },
  { icon: Map, title: "Public Roadmaps", body: "Build trust by showing users exactly where their favorite features sit in your development cycle." },
  { icon: BarChart3, title: "Voter Analytics", body: "Segment requests by MRR, industry, or tier to prioritize high-value wins. Every vote tells a story." },
  { icon: Sparkles, title: "Smart Summaries", body: "AI generates a one-line synopsis of every request so your team can scan a hundred ideas in minutes." },
  { icon: History, title: "Auto Changelog", body: "Ship a feature, auto-notify every upvoter. Public changelog stays evergreen — no copywriting needed." },
  { icon: MessageSquare, title: "Live Discussion", body: "Real-time comments with mentions, reactions, and threads. Customers feel heard, your team stays in flow." },
];

function PreviewCard({
  status,
  statusCls,
  id,
  title,
  body,
  votes,
  comments,
  active = false,
}: {
  status: string;
  statusCls: string;
  id: string;
  title: string;
  body?: string;
  votes: number;
  comments?: number;
  active?: boolean;
}) {
  return (
    <div
      className={
        "bg-card border border-border p-4 rounded-lg shadow-sm " +
        (active ? "hover:border-primary/40 transition-colors" : "opacity-70 scale-[0.98]")
      }
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 items-center">
          <span
            className={
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border " + statusCls
            }
          >
            {status}
          </span>
          <span className="text-xs font-mono text-muted-foreground">{id}</span>
        </div>
        <div className="size-9 border border-border rounded-md flex flex-col items-center justify-center bg-background">
          <ChevronUp className="size-3.5" strokeWidth={2.5} />
          <span className="text-[10px] font-bold leading-none">{votes}</span>
        </div>
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      {body && <p className="text-xs text-muted-foreground mb-3">{body}</p>}
      {comments !== undefined && (
        <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" /> {comments}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanMini({ label, pct, muted = false }: { label: string; pct: number; muted?: boolean }) {
  return (
    <div className="flex-1 min-w-0 bg-card border border-border rounded p-2">
      <div className={"text-[9px] font-mono uppercase mb-1 " + (muted ? "text-muted-foreground" : "text-primary")}>
        {label}
      </div>
      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={"h-full " + (muted ? "bg-border" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
