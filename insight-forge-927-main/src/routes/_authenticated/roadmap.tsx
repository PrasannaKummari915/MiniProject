import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { ChevronUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

const COLUMNS = [
  { key: "requested", label: "Requested", color: "bg-muted-foreground" },
  { key: "planned", label: "Planned", color: "bg-info" },
  { key: "in_progress", label: "In Progress", color: "bg-warning" },
  { key: "testing", label: "Testing", color: "bg-primary" },
  { key: "released", label: "Released", color: "bg-success" },
] as const;

function RoadmapPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const { data } = await supabase
        .from("features")
        .select("id,title,status,vote_count,category")
        .order("vote_count", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("roadmap")
      .on("postgres_changes", { event: "*", schema: "public", table: "features" }, () =>
        qc.invalidateQueries({ queryKey: ["roadmap"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const grouped = COLUMNS.map((c) => ({
    ...c,
    items: (q.data ?? []).filter((f) => f.status === c.key),
  }));

  return (
    <AppShell>
      <div className="animate-reveal">
        <div className="mb-8">
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Live roadmap
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">
            What we're building.
          </h1>
          <p className="text-muted-foreground mt-2">
            Every column updates in real time as the team ships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {grouped.map((col) => (
            <div key={col.key} className="bg-secondary/30 border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={"size-1.5 rounded-full " + col.color} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-xs font-mono text-muted-foreground ml-auto">
                  {col.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.items.map((f) => (
                  <Link
                    key={f.id}
                    to="/features/$id"
                    params={{ id: f.id }}
                    className="block p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        {f.category}
                      </span>
                      <span className="text-[10px] font-bold flex items-center gap-0.5 text-foreground">
                        <ChevronUp className="size-3" />
                        {f.vote_count}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium line-clamp-2">{f.title}</h4>
                  </Link>
                ))}
                {col.items.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
