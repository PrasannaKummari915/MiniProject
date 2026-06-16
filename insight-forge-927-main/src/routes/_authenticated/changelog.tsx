import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/changelog")({
  component: ChangelogPage,
});

function ChangelogPage() {
  const q = useQuery({
    queryKey: ["changelog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("changelog")
        .select("id,title,body,version,feature_id,published_at")
        .order("published_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto animate-reveal">
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
          Changelog
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1 mb-2">
          What's new.
        </h1>
        <p className="text-muted-foreground mb-12">
          Every release auto-notifies the people who voted for it.
        </p>

        {q.data?.length === 0 && (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <History className="size-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No releases published yet.</p>
          </div>
        )}

        <div className="space-y-10">
          {q.data?.map((entry) => (
            <article key={entry.id} className="relative pl-8 border-l border-border">
              <div className="absolute -left-1.5 top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="flex items-center gap-2 mb-3">
                {entry.version && (
                  <span className="text-[10px] font-mono uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">
                    v{entry.version}
                  </span>
                )}
                <time className="text-xs font-mono text-muted-foreground">
                  {format(new Date(entry.published_at), "MMM d, yyyy")}
                </time>
              </div>
              <h2 className="font-display text-xl font-bold mb-3">{entry.title}</h2>
              <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{entry.body}</p>
              {entry.feature_id && (
                <Link
                  to="/features/$id"
                  params={{ id: entry.feature_id }}
                  className="text-xs font-medium text-primary hover:underline mt-3 inline-block"
                >
                  View original request →
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
