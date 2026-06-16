import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { summarizeFeature, findDuplicates } from "@/lib/ai.functions";
import { ArrowLeft, Sparkles, AlertTriangle, Mic } from "lucide-react";

export const Route = createFileRoute("/_authenticated/features/new")({
  component: NewFeaturePage,
});

const CATEGORIES = [
  { value: "ui", label: "UI / Design" },
  { value: "performance", label: "Performance" },
  { value: "integration", label: "Integration" },
  { value: "mobile", label: "Mobile" },
  { value: "ai", label: "AI" },
  { value: "analytics", label: "Analytics" },
  { value: "other", label: "Other" },
] as const;

function NewFeaturePage() {
  const navigate = useNavigate();
  const summarize = useServerFn(summarizeFeature);
  const checkDupes = useServerFn(findDuplicates);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [tags, setTags] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [dupes, setDupes] = useState<{ id: string; title: string }[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);

  const runAiAssist = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Add a title and description first.");
      return;
    }
    setAiBusy(true);
    try {
      const { data: candidates } = await supabase
        .from("features")
        .select("id,title")
        .limit(40);

      const [sumRes, dupRes] = await Promise.all([
        summarize({ data: { title, description } }),
        checkDupes({
          data: {
            title,
            candidates: (candidates ?? []).map((c) => ({ id: c.id, title: c.title })),
          },
        }),
      ]);
      setSummary(sumRes.summary);
      const matched = (candidates ?? []).filter((c) => dupRes.matches.includes(c.id));
      setDupes(matched);
      toast.success("AI analysis ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI assist failed");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8);
      const { data, error } = await supabase
        .from("features")
        .insert({
          title,
          description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: category as any,
          tags: tagList,
          author_id: u.user.id,
          ai_summary: summary,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Feature submitted");
      navigate({ to: "/features/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const startVoiceInput = () => {
    // Web Speech API (browser-only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    setRecording(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript as string;
      setDescription((d) => (d ? d + " " + text : text));
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto animate-reveal">
        <Link
          to="/features"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to features
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Submit a feature request
        </h1>
        <p className="text-muted-foreground mb-8">
          Be specific. AI will summarize it and check for duplicates before you ship it to the
          backlog.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Native dark mode for mobile"
              required
              maxLength={140}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <button
                type="button"
                onClick={startVoiceInput}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <Mic className={"size-3.5 " + (recording ? "text-destructive animate-pulse" : "")} />
                {recording ? "Listening..." : "Voice input"}
              </button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, the proposed solution, and who benefits..."
              required
              rows={6}
              maxLength={4000}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="enterprise, accessibility"
              />
            </div>
          </div>

          {/* AI assist panel */}
          <div className="border border-primary/15 bg-primary/[0.03] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                  AI Pre-flight
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={runAiAssist} disabled={aiBusy}>
                {aiBusy ? "Analyzing..." : "Run analysis"}
              </Button>
            </div>
            {summary && (
              <div className="text-sm text-foreground/90 italic border-l-2 border-primary pl-3">
                "{summary}"
              </div>
            )}
            {dupes.length > 0 && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <AlertTriangle className="size-4" />
                  <span className="font-semibold">Possible duplicates detected</span>
                </div>
                <ul className="space-y-1.5">
                  {dupes.map((d) => (
                    <li key={d.id}>
                      <Link
                        to="/features/$id"
                        params={{ id: d.id }}
                        className="text-primary hover:underline"
                      >
                        {d.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!summary && !aiBusy && (
              <p className="text-xs text-muted-foreground">
                Tip: run analysis before submitting to get an AI summary and avoid duplicate work.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit feature"}
            </Button>
            <Link
              to="/features"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
