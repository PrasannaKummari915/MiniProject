import { Link } from "@tanstack/react-router";
import { ChevronUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "requested" | "planned" | "in_progress" | "testing" | "released";
export type CategoryType = "ui" | "performance" | "integration" | "mobile" | "ai" | "analytics" | "other";

const STATUS_STYLES: Record<StatusType, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-muted text-muted-foreground border-border" },
  planned: { label: "Planned", cls: "bg-info/10 text-info border-info/20" },
  in_progress: { label: "In Progress", cls: "bg-warning/10 text-warning border-warning/30" },
  testing: { label: "Testing", cls: "bg-accent text-accent-foreground border-accent-foreground/10" },
  released: { label: "Released", cls: "bg-success/10 text-success border-success/30" },
};

const CATEGORY_LABEL: Record<CategoryType, string> = {
  ui: "UI",
  performance: "Performance",
  integration: "Integration",
  mobile: "Mobile",
  ai: "AI",
  analytics: "Analytics",
  other: "Other",
};

export function StatusBadge({ status }: { status: StatusType }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border",
        s.cls,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: CategoryType }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export interface FeatureCardData {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  category: CategoryType;
  vote_count: number;
  comment_count: number;
  hasVoted?: boolean;
}

export function VoteButton({
  count,
  voted,
  onClick,
  loading,
}: {
  count: number;
  voted: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      disabled={loading}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-md border min-w-[56px] py-1.5 px-2 transition-all",
        voted
          ? "bg-primary text-primary-foreground border-primary shadow-glow"
          : "bg-background border-border text-foreground hover:border-primary hover:text-primary",
        loading && "opacity-60",
      )}
      aria-label="Upvote"
    >
      <ChevronUp className="size-4" strokeWidth={2.5} />
      <span className="text-xs font-bold leading-none">{count}</span>
    </button>
  );
}

export function FeatureCard({
  feature,
  onVote,
  voteLoading,
}: {
  feature: FeatureCardData;
  onVote?: () => void;
  voteLoading?: boolean;
}) {
  return (
    <Link
      to="/features/$id"
      params={{ id: feature.id }}
      className="block group bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/40 hover:shadow-elevated transition-all"
    >
      <div className="flex items-start gap-4">
        <VoteButton
          count={feature.vote_count}
          voted={!!feature.hasVoted}
          onClick={onVote}
          loading={voteLoading}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={feature.status} />
            <CategoryBadge category={feature.category} />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{feature.description}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {feature.comment_count} {feature.comment_count === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
