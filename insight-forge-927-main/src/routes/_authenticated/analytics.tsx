import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const CAT_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#64748b"];

function AnalyticsPage() {
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data: features } = await supabase
        .from("features")
        .select("id,status,category,vote_count,comment_count,created_at");
      return features ?? [];
    },
  });

  const features = q.data ?? [];

  const statusData = ["requested", "planned", "in_progress", "testing", "released"].map((s) => ({
    name: s.replace("_", " "),
    value: features.filter((f) => f.status === s).length,
  }));

  const catMap = new Map<string, number>();
  features.forEach((f) => catMap.set(f.category, (catMap.get(f.category) ?? 0) + 1));
  const categoryData = Array.from(catMap.entries()).map(([k, v]) => ({ name: k, value: v }));

  // Top 7 most-voted
  const topVoted = [...features]
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 7)
    .map((f) => ({ name: f.id.slice(0, 6), votes: f.vote_count }));

  const totalVotes = features.reduce((s, f) => s + f.vote_count, 0);
  const totalComments = features.reduce((s, f) => s + f.comment_count, 0);

  return (
    <AppShell>
      <div className="animate-reveal">
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
          Velocity engine
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1 mb-8">
          Analytics.
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KPI label="Requests" value={features.length} />
          <KPI label="Total Votes" value={totalVotes} />
          <KPI label="Comments" value={totalComments} />
          <KPI label="Avg Votes / Request" value={features.length ? Math.round(totalVotes / features.length) : 0} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Status distribution">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="By category">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Top voted requests" wide>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topVoted} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="votes" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border bg-card rounded-xl p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={"border border-border bg-card rounded-xl p-5 " + (wide ? "lg:col-span-2" : "")}>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
