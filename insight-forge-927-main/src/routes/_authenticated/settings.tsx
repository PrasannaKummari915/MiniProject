import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun, LogOut, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("ff-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = (next: boolean) => {
    setDark(next);
    localStorage.setItem("ff-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto animate-reveal">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">
          Settings.
        </h1>

        <div className="space-y-4">
          <SettingCard
            icon={dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            title="Theme"
            description="Switch between light and dark interfaces."
          >
            <div className="flex items-center gap-3">
              <Label htmlFor="theme" className="text-sm">
                {dark ? "Dark" : "Light"}
              </Label>
              <Switch id="theme" checked={dark} onCheckedChange={toggleTheme} />
            </div>
          </SettingCard>

          <SettingCard
            icon={<Bell className="size-4" />}
            title="Real-time notifications"
            description="Get notified when features you voted on change status."
          >
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </SettingCard>

          <SettingCard
            icon={<LogOut className="size-4 text-destructive" />}
            title="Sign out"
            description="End your session on this device."
          >
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </SettingCard>
        </div>
      </div>
    </AppShell>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl bg-card p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-md bg-secondary grid place-items-center text-foreground">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
