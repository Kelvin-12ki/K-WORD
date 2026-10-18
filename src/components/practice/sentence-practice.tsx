"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WordDTO, PracticeAttemptDTO } from "@/types";

export function SentencePractice({
  word,
  onAttempt,
}: {
  word: WordDTO;
  onAttempt?: (a: PracticeAttemptDTO) => void;
}) {
  const [sentence, setSentence] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<PracticeAttemptDTO | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sentence.trim().length < 5) {
      toast.error("Write a full sentence");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/words/${word.id}/practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.attempt);
      onAttempt?.(data.attempt);
      toast.success(`Scored ${data.attempt.score}/10`);
      setSentence("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4 text-primary" /> Use &quot;{word.word}&quot; in a sentence
        </CardTitle>
        <CardDescription>
          AI evaluates grammar, correctness, naturalness and contextual fit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            rows={3}
            placeholder={`Write a natural sentence using "${word.word}"…`}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Evaluate with AI
          </Button>
        </form>

        {result && (
          <div className="animate-scale-in space-y-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Your score</p>
              <Badge variant={result.score >= 8 ? "accent" : result.score >= 6 ? "default" : "destructive"} className="text-sm">
                {result.score}/10
              </Badge>
            </div>
            <Progress
              value={result.score * 10}
              className="h-2"
              indicatorClassName={result.score >= 8 ? "bg-accent" : result.score >= 6 ? "" : "bg-destructive"}
            />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Grammar", value: result.grammarScore },
                { label: "Naturalness", value: result.naturalnessScore },
                { label: "Context", value: result.contextScore },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-card p-2.5">
                  <p className="text-lg font-bold">{m.value}/10</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.feedback}</p>
            {result.suggestion && (
              <div className="rounded-lg border border-accent/25 bg-accent/5 p-3">
                <p className="text-xs font-medium text-accent">Suggested improvement</p>
                <p className="mt-1 text-sm italic">{result.suggestion}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
