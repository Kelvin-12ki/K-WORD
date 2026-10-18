"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Volume2,
  Star,
  Loader2,
  Plus,
  Sparkles,
  Save,
  PenLine,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MasteryBadge } from "@/components/mastery";
import { SentencePractice } from "@/components/practice/sentence-practice";
import { formatRelative, formatDate } from "@/lib/utils";
import { MASTERY_LEVEL_LABELS, DEFAULT_CATEGORIES } from "@/lib/constants";
import type { WordDTO, UserExampleDTO, PracticeAttemptDTO } from "@/types";

export function WordDetailClient({
  word: initial,
  examples: initialExamples,
  attempts: initialAttempts,
}: {
  word: WordDTO;
  examples: UserExampleDTO[];
  attempts: PracticeAttemptDTO[];
}) {
  const [word, setWord] = React.useState(initial);
  const [examples, setExamples] = React.useState(initialExamples);
  const [attempts, setAttempts] = React.useState(initialAttempts);
  const [form, setForm] = React.useState({
    word: initial.word,
    meaning: initial.meaning,
    category: initial.category,
    learnedFrom: initial.learnedFrom ?? "",
    notes: initial.notes ?? "",
    partOfSpeech: initial.partOfSpeech ?? "",
    pronunciation: initial.pronunciation ?? "",
  });
  const [saving, setSaving] = React.useState(false);
  const [exampleDraft, setExampleDraft] = React.useState("");
  const [addingExample, setAddingExample] = React.useState(false);

  async function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word.word);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function toggleFavorite() {
    const res = await fetch(`/api/words/${word.id}/favorite`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setWord({ ...word, favorite: data.favorite });
      toast.success(data.favorite ? "Added to favorites" : "Removed from favorites");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/words/${word.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWord(data.word);
      toast.success("Word updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function addExample() {
    if (exampleDraft.trim().length < 5) {
      toast.error("Write a slightly longer example");
      return;
    }
    setAddingExample(true);
    try {
      const res = await fetch(`/api/words/${word.id}/examples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: exampleDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExamples([data.example, ...examples]);
      setExampleDraft("");
      toast.success("Example saved +8 XP");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setAddingExample(false);
    }
  }

  const masteryPct = (word.masteryLevel / 5) * 100;

  return (
    <div className="animate-fade-up">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/words">
          <ArrowLeft className="h-4 w-4" /> Back to words
        </Link>
      </Button>

      <PageHeader
        title={word.word}
        description={word.pronunciation}
        actions={
          <>
            <Button variant="outline" size="icon" aria-label="Pronounce" onClick={speak}>
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={toggleFavorite}>
              <Star
                className={word.favorite ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"}
              />
              {word.favorite ? "Favorited" : "Favorite"}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mastery</p>
            <div className="mt-2 flex items-center gap-3">
              <MasteryBadge level={word.masteryLevel} />
              <span className="text-sm text-muted-foreground">
                {MASTERY_LEVEL_LABELS[word.masteryLevel]}
              </span>
            </div>
            <Progress value={masteryPct} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reviews</p>
            <p className="mt-1 text-2xl font-bold">{word.reviewCount}</p>
            <p className="text-xs text-muted-foreground">
              Next {formatRelative(word.nextReviewDate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Practices</p>
            <p className="mt-1 text-2xl font-bold">
              {word.correctPractices}
              <span className="text-base text-muted-foreground">/{word.totalPractices}</span>
            </p>
            <p className="text-xs text-muted-foreground">Scored 7+ sentences</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BookOpen className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Plus className="h-3.5 w-3.5" /> My Examples ({examples.length})
          </TabsTrigger>
          <TabsTrigger value="practice">
            <PenLine className="h-3.5 w-3.5" /> Practice
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-3.5 w-3.5" /> AI Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="meaning">Meaning</Label>
                <Textarea
                  id="meaning"
                  rows={3}
                  value={form.meaning}
                  onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos">Part of speech</Label>
                <Input
                  id="pos"
                  value={form.partOfSpeech}
                  onChange={(e) => setForm({ ...form, partOfSpeech: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pron">Pronunciation</Label>
                <Input
                  id="pron"
                  value={form.pronunciation}
                  onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set([...DEFAULT_CATEGORIES, form.category])].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="src">Learned from</Label>
                <Input
                  id="src"
                  value={form.learnedFrom}
                  onChange={(e) => setForm({ ...form, learnedFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Synonyms</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {word.synonyms.length ? (
                  word.synonyms.map((s) => (
                    <Badge key={s} variant="default">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">None recorded</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Antonyms</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {word.antonyms.length ? (
                  word.antonyms.map((a) => (
                    <Badge key={a} variant="destructive">
                      {a}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">None recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your example sentences</CardTitle>
            </CardHeader>
            <CardContent>
              {word.exampleSentences.length === 0 ? (
                <p className="text-sm text-muted-foreground">No personal examples yet.</p>
              ) : (
                <ul className="space-y-2">
                  {word.exampleSentences.map((ex, i) => (
                    <li key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      {ex}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Examples</CardTitle>
              <CardDescription>
                Personal sentences you keep forever. They reinforce natural usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`Use "${word.word}" in a sentence…`}
                  value={exampleDraft}
                  onChange={(e) => setExampleDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExample()}
                />
                <Button onClick={addExample} disabled={addingExample}>
                  {addingExample ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {examples.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No examples yet. Write your first one above.
                </p>
              ) : (
                <ul className="space-y-2">
                  {examples.map((ex) => (
                    <li
                      key={ex.id}
                      className="rounded-xl border border-border/60 px-4 py-3 text-sm"
                    >
                      {ex.text}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(ex.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice">
          <SentencePractice
            word={word}
            onAttempt={(a) => setAttempts([a, ...attempts])}
          />
          {attempts.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Recent attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {attempts.map((a) => (
                    <li key={a.id} className="rounded-xl border border-border/60 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm">{a.sentence}</p>
                        <Badge variant={a.score >= 8 ? "accent" : a.score >= 6 ? "default" : "destructive"}>
                          {a.score}/10
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{a.feedback}</p>
                      {a.suggestion && (
                        <p className="mt-1 text-xs italic text-accent">↳ {a.suggestion}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" /> AI-generated examples
              </CardTitle>
              <CardDescription>
                Contextual sentences across professional, business, academic and daily usage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {word.aiExamples.length === 0 ? (
                <p className="text-sm text-muted-foreground">No AI examples for this word.</p>
              ) : (
                <ul className="space-y-2.5">
                  {word.aiExamples.map((ex, i) => (
                    <li key={i} className="rounded-xl bg-muted/50 px-4 py-3">
                      <Badge variant="secondary" className="mb-1.5">
                        {ex.context}
                      </Badge>
                      <p className="text-sm leading-relaxed">{ex.sentence}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
