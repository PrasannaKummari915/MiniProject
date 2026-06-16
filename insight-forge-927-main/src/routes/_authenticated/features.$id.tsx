import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge, CategoryBadge, VoteButton } from "@/components/feature-card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/features/$id")({
  component: FeatureDetail,
});

function FeatureDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const featureQ = useQuery({
    queryKey: ["feature", id, userId],
    queryFn: async () => {
      const { data: feature, error } = await supabase
        .from("features")
        .select(
          "id,title,description,status,category,tags,vote_count,comment_count,ai_summary,created_at,author_id",
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      let hasVotedRow = null as { id: string } | null;
      if (userId) {
        const { data: v } = await supabase
          .from("votes")
          .select("id")
          .eq("feature_id", id)
          .eq("user_id", userId)
          .maybeSingle();
        hasVotedRow = v;
      }
      const myVote = hasVotedRow;
      const { data: author } = await supabase
        .from("profiles")
        .select("username,full_name,avatar_url")
        .eq("id", feature.author_id)
        .maybeSingle();
      return { feature, author, hasVoted: !!myVote };
    },
    enabled: !!id,
  });

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id,body,created_at,author_id,parent_id")
        .eq("feature_id", id)
        .order("created_at", { ascending: true });
      const authorIds = Array.from(new Set((data ?? []).map((c) => c.author_id)));
      const { data: authors } = authorIds.length
        ? await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", authorIds)
        : { data: [] };
      const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
      return (data ?? []).map((c) => ({ ...c, author: authorMap.get(c.author_id) ?? null }));
    },
    enabled: !!id,
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("feature-" + id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `feature_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["comments", id] });
          qc.invalidateQueries({ queryKey: ["feature", id] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `feature_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["feature", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  const voteMutation = useMutation({
    mutationFn: async (voted: boolean) => {
      if (!userId) throw new Error("Sign in to vote");
      if (voted) {
        await supabase.from("votes").delete().match({ feature_id: id, user_id: userId });
      } else {
        await supabase.from("votes").insert({ feature_id: id, user_id: userId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature", id] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Vote failed"),
  });

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!userId) throw new Error("Sign in to comment");
      const { error } = await supabase
        .from("comments")
        .insert({ feature_id: id, author_id: userId, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Comment failed"),
  });

  const visibleComments = useMemo(() => {
    if (!commentsQ.data) return [];
    return showAllComments ? commentsQ.data : commentsQ.data.slice(0, 3);
  }, [commentsQ.data, showAllComments]);

  if (featureQ.isLoading) {
    return (
      <AppShell>
        <div className="text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }
  if (!featureQ.data) {
    return (
      <AppShell>
        <div className="text-muted-foreground">Feature not found.</div>
      </AppShell>
    );
  }
  const { feature, author, hasVoted } = featureQ.data;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto animate-reveal">
        <Link
          to="/features"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to features
        </Link>

        <div className="grid grid-cols-[auto_1fr] gap-5 mb-8">
          <VoteButton
            count={feature.vote_count}
            voted={hasVoted}
            onClick={() => voteMutation.mutate(hasVoted)}
            loading={voteMutation.isPending}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={feature.status} />
              <CategoryBadge category={feature.category} />
              {feature.tags?.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5"
                >
                  #{t}
                </span>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {feature.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>by {author?.full_name || author?.username || "Anonymous"}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(feature.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {feature.ai_summary && (
          <div className="border border-primary/15 bg-primary/[0.03] rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                AI Summary
              </span>
            </div>
            <p className="italic text-foreground/90">"{feature.ai_summary}"</p>
          </div>
        )}

        <div className="prose prose-sm max-w-none mb-12">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Description
          </h2>
          <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Comments */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <button
                onClick={() => setShowAllComments(true)}
                className="hover:underline"
              >
                {feature.comment_count} {feature.comment_count === 1 ? "Comment" : "Comments"}
              </button>
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            {visibleComments.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <div className="size-6 rounded-full bg-gradient-to-br from-primary to-info" />
                  <span className="font-semibold">
                    {c.author?.full_name || c.author?.username || "Anonymous"}
                  </span>
                  <span className="text-muted-foreground">
                    · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-line">{c.body}</p>
              </div>
            ))}
            {commentsQ.data && commentsQ.data.length > 3 && !showAllComments && (
              <button
                onClick={() => setShowAllComments(true)}
                className="w-full py-3 border border-dashed border-border rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                Load {commentsQ.data.length - 3} more comments
              </button>
            )}
            {commentsQ.data?.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                Be the first to comment.
              </div>
            )}
          </div>

          {/* New comment */}
          <div className="bg-card border border-border rounded-xl p-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <Button
                onClick={() => commentMutation.mutate(newComment)}
                disabled={!newComment.trim() || commentMutation.isPending}
                size="sm"
              >
                {commentMutation.isPending ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
