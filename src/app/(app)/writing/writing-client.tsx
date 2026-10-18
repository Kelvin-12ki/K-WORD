"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";

const TYPES = [
  { id: "essay", label: "Essay" },
  { id: "report", label: "Report" },
  { id: "email", label: "Email" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "general", label: "General" },
] as const;

interface Suggestion {
  original: string;
  replacement: string;
  reason: string;
}

interface Analysis {
  vocabularyDiversity: number;
  repetitionScore: number;
  strengthScore: number;
  repeatedWords: { word: string; count: number }[];
  weakPhrases: { phrase: string; suggestion: string }[];
  suggestions: Suggestion[];
  summary: string;
  source?: string;
}

export function WritingClient() {
  const [text, setText] = React.useState("");
  const [type, setType] = React.useState<string>("general");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Analysis | null>(null);

  async function analyze() {
    if (text.trim().length < 20) {
      toast.error("Paste at least a few sentences to analyze");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      toast.success("Analysis complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="AI Writing Assistant"
        description="Paste an essay, report, email or post. Get vocabulary diversity scores and stronger word suggestions from your bank."
      />

      <Card className="mb-5">
        <CardContent className="space-y-4 p-5">
          <Tabs value={type} onValueChange={setType}>
            <TabsList>
              {TYPES.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Textarea
            rows={10}
            placeholder="Paste your writing here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-y"
          />
          <div className="flex items-center gap-2">
            <Button onClick={analyze} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyze writing
            </Button>
            <span className="text-xs text-muted-foreground">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="animate-fade-up space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Vocabulary diversity", value: result.vocabularyDiversity, tone: "bg-primary" },
              { label: "Repetition control", value: result.repetitionScore, tone: "bg-accent" },
              { label: "Overall strength", value: result.strengthScore, tone: "bg-violet-500" },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</p>
                    <p className="text-2xl font-bold">{m.value}</p>
                  </div>
                  <Progress value={m.value} className="mt-3 h-2" indicatorClassName={m.tone} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
              {result.source === "fallback" && (
                <Badge variant="warning" className="mt-3">
                  Offline heuristic analysis — add OPENAI_API_KEY for deeper insights
                </Badge>
              )}
            </CardContent>
          </Card>

          {result.repeatedWords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Repetition hotspots</CardTitle>
                <CardDescription>Words used 3+ times</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.repeatedWords.map((r) => (
                  <Badge key={r.word} variant="destructive">
                    {r.word} ×{r.count}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCcw className="h-4 w-4 text-accent" /> Suggested upgrades
                </CardTitle>
                <CardDescription>
                  Stronger alternatives — prioritized from your saved vocabulary bank.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="rounded-xl border border-border/60 p-3.5">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded bg-destructive/10 px-2 py-0.5 text-destructive line-through">
                          {s.original}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">
                          {s.replacement}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{s.reason}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState
          icon={FileText}
          title="No analysis yet"
          description="Paste your writing above and click Analyze. K WORD highlights weak wording and suggests stronger vocabulary you already know."
        />
      )}
    </div>
  );
}
