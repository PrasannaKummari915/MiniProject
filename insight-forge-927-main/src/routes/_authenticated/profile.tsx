import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const profileQ = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,username,bio,xp,avatar_url")
        .eq("id", userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (profileQ.data) {
      setFullName(profileQ.data.full_name ?? "");
      setUsername(profileQ.data.username ?? "");
      setBio(profileQ.data.bio ?? "");
    }
  }, [profileQ.data]);

  const myStats = useQuery({
    queryKey: ["my-stats", userId],
    queryFn: async () => {
      if (!userId) return { submitted: 0, voted: 0, commented: 0 };
      const [a, b, c] = await Promise.all([
        supabase.from("features").select("*", { count: "exact", head: true }).eq("author_id", userId),
        supabase.from("votes").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("author_id", userId),
      ]);
      return { submitted: a.count ?? 0, voted: b.count ?? 0, commented: c.count ?? 0 };
    },
    enabled: !!userId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, username, bio })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-reveal">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">
          Your profile.
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Stat label="Submitted" value={myStats.data?.submitted ?? 0} />
          <Stat label="Voted" value={myStats.data?.voted ?? 0} />
          <Stat label="Commented" value={myStats.data?.commented ?? 0} />
        </div>

        <div className="border border-border rounded-xl bg-card p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div className="size-14 rounded-full bg-gradient-to-br from-primary to-info" />
            <div>
              <div className="font-semibold">{fullName || "Anonymous"}</div>
              <div className="text-sm text-muted-foreground">@{username || "—"}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-display text-2xl font-bold text-primary">
                {profileQ.data?.xp ?? 0}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                XP
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              pattern="[a-z0-9_]+"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the community what you build..."
              maxLength={280}
            />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-card rounded-xl p-4 text-center">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
