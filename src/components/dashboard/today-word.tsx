"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { WordDTO } from "@/types";

export function TodayWordCard({ challengeCompleted }: { challengeCompleted: boolean }) {
  const router = useRouter();
  const [word, setWord] = React.useState<WordDTO | null>(null);
  const [completed, setCompleted] = React.useState(challengeCompleted);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/challenges/today");
        const data = await res.json();
        if (!cancelled) {
          setWord(data.word);
          setCompleted(Boolean(data.completed));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function complete() {
    setBusy(true);
    try {
      const res = await fetch("/api/challenges/complete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompleted(true);
      toast.success("Challenge complete! +20 XP");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> Today&apos;s Word
        </CardTitle>
        <CardDescription>Challenge: use this word three times today</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : !word ? (
          <p className="text-sm text-muted-foreground">
            Add a word to unlock your daily challenge.
          </p>
        ) : (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-2xl font-bold">{word.word}</h3>
              <Badge variant="secondary">{word.category}</Badge>
            </div>
            {word.pronunciation && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">{word.pronunciation}</p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{word.meaning}</p>
            <div className="mt-5 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push(`/words/${word.id}`)}>
                Practice it
              </Button>
              {completed ? (
                <Button size="sm" variant="accent" disabled>
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </Button>
              ) : (
                <Button size="sm" variant="accent" onClick={complete} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Mark Complete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
