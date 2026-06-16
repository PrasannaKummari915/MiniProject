import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FeatureCard, type FeatureCardData } from "@/components/feature-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Lightbulb, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const featuresQ = useQuery({
    queryKey: ["dashboard-features"],
    queryFn: async () => {
      const [{ data: features }, { data: myVotes }] = await Promise.all([
        supabase
          .from("features")
          .select("id,title,description,status,category,vote_count,comment_count,created_at")
          .order("vote_count", { ascending: false })
          .limit(8),
        supabase.from("votes").select("feature_id"),
      ]);
      const votedSet = new Set((myVotes ?? []).map((v) => v.feature_id));
      return (features ?? []).map<FeatureCardData>((f) => ({
        ...f,
        hasVoted: votedSet.has(f.id),
      }));
    },
  });

  const statsQ = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [{ count: totalFeatures }, { count: totalVotes }, { count: contributors }] =
        await Promise.all([
          supabase.from("features").select("*", { count: "exact", head: true }),
          supabase.from("votes").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);
      return { totalFeatures: totalFeatures ?? 0, totalVotes: totalVotes ?? 0, contributors: contributors ?? 0 };
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("dashboard-features")
      .on("postgres_changes", { event: "*", schema: "public", table: "features" }, () => {
        qc.invalidateQueries({ queryKey: ["dashboard-features"] });
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        qc.invalidateQueries({ queryKey: ["dashboard-features"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const voteMutation = useMutation({
    mutationFn: async ({ featureId, voted }: { featureId: string; voted: boolean }) => {
      if (!userId) throw new Error("Not signed in");
      if (voted) {
        const { error } = await supabase.from("votes").delete().match({ feature_id: featureId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("votes").insert({ feature_id: featureId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-features"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Vote failed"),
  });

  return (
    <AppShell>
      <div className="animate-reveal">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Welcome back
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">
          Your feedback control room.
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard
            icon={<Lightbulb className="size-4" />}
            label="Total Requests"
            value={statsQ.data?.totalFeatures ?? 0}
          />
          <StatCard
            icon={<TrendingUp className="size-4" />}
            label="Total Votes"
            value={statsQ.data?.totalVotes ?? 0}
          />
          <StatCard
            icon={<Users className="size-4" />}
            label="Contributors"
            value={statsQ.data?.contributors ?? 0}
          />
          <StatCard
            icon={<Sparkles className="size-4 text-primary" />}
            label="AI Velocity"
            value="+12.4%"
            highlight
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Trending Requests
              </h2>
              <Link to="/features" className="text-xs font-medium text-primary hover:underline">
                View all →
              </Link>
            </div>
            {featuresQ.isLoading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            {featuresQ.data?.length === 0 && (
              <div className="border border-dashed border-border rounded-xl p-10 text-center">
                <p className="text-muted-foreground mb-4">No feature requests yet.</p>
                <Link
                  to="/features/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium"
                >
                  Submit the first idea
                </Link>
              </div>
            )}
            {featuresQ.data?.map((f) => (
              <FeatureCard
                key={f.id}
                feature={f}
                onVote={() => voteMutation.mutate({ featureId: f.id, voted: !!f.hasVoted })}
                voteLoading={voteMutation.isPending}
              />
            ))}
          </div>

          {/* AI Insights sidebar */}
          <aside className="space-y-4">
            <div className="border border-primary/15 bg-primary/[0.03] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                  AI Insight
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                Requests mentioning <span className="font-semibold text-primary">"voice input"</span>{" "}
                have grown <span className="font-bold">42%</span> this week. Consider promoting
                related work to the roadmap.
              </p>
            </div>

            <div className="border border-border bg-card rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Live Activity</h3>
              <ul className="space-y-3 text-sm">
                <ActivityRow text="Someone voted on Dark Mode" time="now" />
                <ActivityRow text="New comment on AI Search" time="2m" />
                <ActivityRow text="Voice Capture moved to Testing" time="14m" />
                <ActivityRow text="3 new requests today" time="1h" />
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "border border-border rounded-xl p-4 " + (highlight ? "bg-primary/[0.04]" : "bg-card")
      }
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function ActivityRow({ text, time }: { text: string; time: string }) {
  return (
    <li className="flex items-start justify-between gap-2">
      <span className="text-foreground/80">{text}</span>
      <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5">{time}</span>
    </li>
  );
}
