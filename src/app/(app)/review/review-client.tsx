"use client";

import * as React from "react";
import { toast } from "sonner";
import { BrainCircuit, RotateCcw, ChevronRight, Loader2, Volume2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { MasteryBadge } from "@/components/mastery";
import type { WordDTO } from "@/types";

type Phase = "front" | "reveal" | "done";

export function ReviewClient() {
  const [queue, setQueue] = React.useState<WordDTO[]>([]);
  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("front");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [reviewed, setReviewed] = React.useState(0);

  React.useEffect(() => {
    fetch("/api/reviews?due=true")
      .then((r) => r.json())
      .then((d) => setQueue(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const current = queue[index];
  const total = queue.length;
  const progressPct = total ? (reviewed / total) * 100 : 0;

  async function rate(difficulty: "easy" | "medium" | "hard") {
    if (!current) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: current.id, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReviewed((r) => r + 1);
      const message =
        difficulty === "easy"
          ? `Easy! Next review in ${data.result.intervalDays} days (+5 XP)`
          : difficulty === "medium"
            ? `Good recall. Next review in ${data.result.intervalDays} days (+5 XP)`
            : `No problem — you'll see it again tomorrow (+7 XP)`;
      toast.success(message);

      if (data.result?.mastered) {
        toast.success(`"${current.word}" is now mastered!`, { duration: 4000 });
      }

      setQueue((q) => q.filter((w) => w.id !== current.id));
      setPhase("front");
      if (index >= queue.length - 1) setIndex(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  }

  function speak() {
    if (!current || typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(current.word);
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  if (loading) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Daily Review" description="Loading your due words…" />
        <Skeleton className="mx-auto h-[420px] max-w-2xl" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Daily Review" description="Spaced repetition keeps words permanent." />
        <EmptyState
          icon={BrainCircuit}
          title={reviewed > 0 ? "Session complete — all caught up!" : "Nothing due today"}
          description={
            reviewed > 0
              ? `You reviewed ${reviewed} word${reviewed === 1 ? "" : "s"}. Come back tomorrow to keep the streak alive.`
              : "No words are scheduled for review right now. Add new words or come back later."
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQueue([]);
                setReviewed(0);
                setLoading(true);
                fetch("/api/reviews?due=true")
                  .then((r) => r.json())
                  .then((d) => setQueue(d.items ?? []))
                  .finally(() => setLoading(false));
              }}
            >
              <RotateCcw className="h-4 w-4" /> Refresh
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Daily Review"
        description="See the word, recall the meaning, then rate your recall."
        actions={
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <BrainCircuit className="h-3.5 w-3.5" /> {reviewed}/{total} done
          </Badge>
        }
      />

      <div className="mx-auto max-w-2xl space-y-5">
        <Progress value={progressPct} className="h-1.5" indicatorClassName="gradient-primary" />

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative p-8 sm:p-12">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Word</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{current.word}</h2>
                {current.pronunciation && (
                  <p className="mt-2 font-mono text-sm text-muted-foreground">
                    {current.pronunciation}
                  </p>
                )}
              </div>
              <Button variant="outline" size="icon" aria-label="Pronounce" onClick={speak}>
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{current.category}</Badge>
              {current.partOfSpeech && <Badge variant="muted">{current.partOfSpeech}</Badge>}
              <MasteryBadge level={current.masteryLevel} />
            </div>

            {phase === "front" ? (
              <div className="mt-10 text-center">
                <p className="mb-6 text-sm text-muted-foreground">
                  Try to recall the meaning in your head before revealing.
                </p>
                <Button size="lg" onClick={() => setPhase("reveal")}>
                  Reveal answer <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="animate-fade-up mt-8 space-y-6">
                <div className="rounded-2xl border border-border bg-muted/40 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Meaning
                  </p>
                  <p className="mt-2 leading-relaxed">{current.meaning}</p>
                </div>

                {current.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Synonyms:</span>
                    {current.synonyms.slice(0, 5).map((s) => (
                      <Badge key={s} variant="default">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                {current.aiExamples[0] && (
                  <p className="text-sm italic leading-relaxed text-muted-foreground">
                    “{current.aiExamples[0].sentence}”
                  </p>
                )}

                <div>
                  <p className="mb-3 text-center text-sm font-medium">How well did you recall it?</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="destructive"
                      size="lg"
                      disabled={submitting}
                      onClick={() => rate("hard")}
                    >
                      Hard
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      disabled={submitting}
                      onClick={() => rate("medium")}
                    >
                      Medium
                    </Button>
                    <Button
                      variant="accent"
                      size="lg"
                      disabled={submitting}
                      onClick={() => rate("easy")}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Easy
                    </Button>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    Hard → tomorrow · Medium → next interval · Easy → skip ahead 2 stages
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
