"use client";

import * as React from "react";
import { Shuffle, Loader2, PenLine, Library } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SentencePractice } from "@/components/practice/sentence-practice";
import { MasteryBadge } from "@/components/mastery";
import { EmptyState } from "@/components/empty-state";
import type { WordDTO } from "@/types";

export function PracticeClient() {
  const [words, setWords] = React.useState<WordDTO[]>([]);
  const [category, setCategory] = React.useState("All");
  const [categories, setCategories] = React.useState<string[]>([]);
  const [current, setCurrent] = React.useState<WordDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [picking, setPicking] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/words?limit=100&sort=mastery&category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((d) => {
        setWords(d.items ?? []);
        if (d.items?.length && !current) setCurrent(d.items[0]);
      })
      .finally(() => setLoading(false));
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories((d.categories ?? []).map((c: { name: string }) => c.name)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  function shuffle() {
    if (!words.length) return;
    setPicking(true);
    setTimeout(() => {
      let next = current;
      let guard = 0;
      while (next?.id === current?.id && guard++ < 10) {
        next = words[Math.floor(Math.random() * words.length)];
      }
      setCurrent(next ?? words[0]);
      setPicking(false);
    }, 220);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sentence Practice"
        description="Write sentences with your saved words. AI scores grammar, naturalness and context."
        actions={
          <>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={shuffle} disabled={picking || !words.length}>
              {picking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shuffle className="h-4 w-4" />
              )}
              New word
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : words.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Add some words first"
          description="Sentence practice works with the words in your vocabulary bank."
        />
      ) : current ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Practicing</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-bold">{current.word}</h2>
              {current.pronunciation && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {current.pronunciation}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current.meaning}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{current.category}</Badge>
                <MasteryBadge level={current.masteryLevel} />
              </div>
              {current.synonyms.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium">Syn:</span> {current.synonyms.slice(0, 4).join(", ")}
                </p>
              )}
              {current.aiExamples[0] && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {current.aiExamples[0].context}
                  </p>
                  <p className="mt-1 text-sm italic">{current.aiExamples[0].sentence}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <SentencePractice word={current} />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={PenLine}
          title="No word selected"
          description="Pick another category or add words to practice."
        />
      )}
    </div>
  );
}
