"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Copy,
  RefreshCcw,
  Loader2,
  ShieldCheck,
  Palette,
  User as UserIcon,
  Layers,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export function SettingsClient() {
  const [apiKey, setApiKey] = React.useState("");
  const [loadingKey, setLoadingKey] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState(false);
  const [profile, setProfile] = React.useState<{
    name: string;
    email: string;
    provider: string;
  } | null>(null);
  const [newCategory, setNewCategory] = React.useState("");
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);
  const [savingCat, setSavingCat] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/extension/key")
      .then((r) => r.json())
      .then((d) => setApiKey(d.apiKey ?? ""))
      .finally(() => setLoadingKey(false));
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile({ name: d.user.name, email: d.user.email, provider: d.user.provider });
        }
      })
      .catch(() => {});
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) =>
        setCustomCategories(
          (d.categories ?? [])
            .filter((c: { isDefault: boolean }) => !c.isDefault)
            .map((c: { name: string }) => c.name)
        )
      )
      .catch(() => {});
  }, []);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/extension/key", { method: "POST" });
      const data = await res.json();
      setApiKey(data.apiKey);
      toast.success("API key regenerated");
    } catch {
      toast.error("Failed to regenerate key");
    } finally {
      setRegenerating(false);
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success("API key copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      if (!res.ok) throw new Error();
      setCustomCategories((c) => [...new Set([...c, newCategory.trim()])]);
      setNewCategory("");
      toast.success("Category added");
    } catch {
      toast.error("Could not add category");
    } finally {
      setSavingCat(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Settings" description="Profile, appearance and developer integrations." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-primary" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sign-in method</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile.provider}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading profile…</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-accent" /> Appearance
            </CardTitle>
            <CardDescription>Switch between light and dark mode.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">System / Light / Dark</Badge>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-violet-500" /> Word Categories
            </CardTitle>
            <CardDescription>
              Defaults: {DEFAULT_CATEGORIES.slice(0, 4).join(", ")} + {DEFAULT_CATEGORIES.length - 4}{" "}
              more. Add your own below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {customCategories.map((c) => (
                <Badge key={c} variant="default">
                  {c}
                </Badge>
              ))}
              {customCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">No custom categories yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Product Management"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <Button onClick={addCategory} disabled={savingCat}>
                {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-amber-500" /> Browser Extension API
            </CardTitle>
            <CardDescription>
              Ready for the K WORD browser extension. Highlight a word on any website and save it
              instantly via <code className="rounded bg-muted px-1">POST /api/extension/save</code>{" "}
              with header <code className="rounded bg-muted px-1">X-API-Key</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={loadingKey ? "Generating…" : apiKey}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" aria-label="Copy key" onClick={copyKey} disabled={!apiKey}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Regenerate key"
                onClick={regenerate}
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 flex items-center gap-1 font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Example request
              </p>
              <pre className="overflow-x-auto font-mono text-[11px]">{`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/extension/save \\
  -H "X-API-Key: ${apiKey ? apiKey.slice(0, 16) + "…" : "kw_…"}" \\
  -H "Content-Type: application/json" \\
  -d '{"word":"pragmatic","context":"from a blog post"}'`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
