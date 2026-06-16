import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

const MEDAL = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  const q = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,xp")
        .order("xp", { ascending: false })
        .limit(25);
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto animate-reveal">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="size-4 text-primary" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Top contributors
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">
          The wall of fame.
        </h1>

        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {q.data?.map((p, i) => (
            <div
              key={p.id}
              className={
                "flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 " +
                (i < 3 ? "bg-primary/[0.02]" : "")
              }
            >
              <div className="w-10 text-center">
                {i < 3 ? (
                  <span className="text-2xl">{MEDAL[i]}</span>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground">#{i + 1}</span>
                )}
              </div>
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-info shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {p.full_name || p.username || "Anonymous"}
                </div>
                {p.username && (
                  <div className="text-xs text-muted-foreground">@{p.username}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-bold flex items-center gap-1 justify-end">
                  {i === 0 && <Crown className="size-4 text-warning" />}
                  {p.xp}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  XP
                </div>
              </div>
            </div>
          ))}
          {q.data?.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              No contributors yet. Be the first.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
