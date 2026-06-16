import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FeatureCard, type FeatureCardData } from "@/components/feature-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/features/")({
  component: FeaturesIndex,
});

const STATUSES = ["all", "requested", "planned", "in_progress", "testing", "released"] as const;
const SORTS = [
  { id: "top", label: "Top voted" },
  { id: "new", label: "Newest" },
  { id: "trending", label: "Most discussed" },
] as const;

function FeaturesIndex() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("top");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const featuresQ = useQuery({
    queryKey: ["features", status, sort],
    queryFn: async () => {
      let req = supabase
        .from("features")
        .select("id,title,description,status,category,vote_count,comment_count,created_at");
      if (status !== "all") req = req.eq("status", status);
      const orderCol = sort === "new" ? "created_at" : sort === "trending" ? "comment_count" : "vote_count";
      const { data } = await req.order(orderCol, { ascending: false }).limit(100);
      const { data: myVotes } = await supabase.from("votes").select("feature_id");
      const votedSet = new Set((myVotes ?? []).map((v) => v.feature_id));
      return (data ?? []).map<FeatureCardData>((f) => ({ ...f, hasVoted: votedSet.has(f.id) }));
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return featuresQ.data ?? [];
    const term = q.toLowerCase();
    return (featuresQ.data ?? []).filter(
      (f) => f.title.toLowerCase().includes(term) || f.description.toLowerCase().includes(term),
    );
  }, [q, featuresQ.data]);

  useEffect(() => {
    const ch = supabase
      .channel("features-index")
      .on("postgres_changes", { event: "*", schema: "public", table: "features" }, () => {
        qc.invalidateQueries({ queryKey: ["features"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        qc.invalidateQueries({ queryKey: ["features"] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["features"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Vote failed"),
  });

  return (
    <AppShell>
      <div className="animate-reveal">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Feature requests
            </h1>
            <p className="text-muted-foreground mt-1">
              Vote on what matters. AI keeps duplicates merged.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide transition-colors border",
                status === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-6">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "text-xs font-mono uppercase tracking-widest pb-1 border-b-2 transition-colors",
                sort === s.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && !featuresQ.isLoading && (
            <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
              No matching requests.
            </div>
          )}
          {filtered.map((f) => (
            <FeatureCard
              key={f.id}
              feature={f}
              onVote={() => voteMutation.mutate({ featureId: f.id, voted: !!f.hasVoted })}
              voteLoading={voteMutation.isPending}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
