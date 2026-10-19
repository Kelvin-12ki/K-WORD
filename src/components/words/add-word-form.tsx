"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnrichmentResult } from "@/lib/ai/service";

interface CategoryOption {
  name: string;
  count: number;
}

export function AddWordForm() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    word: "",
    meaning: "",
    category: "Technology",
    learnedFrom: "",
    notes: "",
    enrichWithAI: true,
  });
  const [examples, setExamples] = React.useState<string[]>([]);
  const [exampleDraft, setExampleDraft] = React.useState("");
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [preview, setPreview] = React.useState<EnrichmentResult | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  async function runPreview() {
    if (!form.word.trim()) {
      toast.error("Enter a word first");
      return;
    }
    setPreviewing(true);
    try {
      const res = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: form.word, meaning: form.meaning || undefined, category: form.category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
      if (!form.meaning && data.refinedMeaning) {
        setForm((f) => ({ ...f, meaning: data.refinedMeaning }));
      }
      toast.success("AI enrichment ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, exampleSentences: examples }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`"${data.word.word}" added to your bank!`);
      router.push(`/words/${data.word.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save word");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Add New Word"
        description="Capture a word from a meeting, book, podcast or conversation."
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="word">Word *</Label>
                <Input
                  id="word"
                  placeholder="e.g. Correspondence"
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(["Technology", ...categories.map((c) => c.name)])].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meaning">Meaning *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={runPreview}
                  disabled={previewing}
                >
                  {previewing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Preview AI enrichment
                </Button>
              </div>
              <Textarea
                id="meaning"
                placeholder="Communication through written messages."
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="learnedFrom">Where you learned it</Label>
                <Input
                  id="learnedFrom"
                  placeholder="Supervisor feedback, podcast…"
                  value={form.learnedFrom}
                  onChange={(e) => setForm({ ...form, learnedFrom: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch
                  id="ai"
                  checked={form.enrichWithAI}
                  onCheckedChange={(v) => setForm({ ...form, enrichWithAI: v })}
                />
                <Label htmlFor="ai" className="cursor-pointer text-muted-foreground">
                  Auto-enrich with AI on save
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Context, memory hooks, usage tips…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Example sentences (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add your own example…"
                  value={exampleDraft}
                  onChange={(e) => setExampleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && exampleDraft.trim()) {
                      e.preventDefault();
                      setExamples([...examples, exampleDraft.trim()]);
                      setExampleDraft("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!exampleDraft.trim()) return;
                    setExamples([...examples, exampleDraft.trim()]);
                    setExampleDraft("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {examples.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {examples.map((ex, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span>{ex}</span>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => setExamples(examples.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {preview && (
          <Card className="border-accent/30 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" /> AI Enrichment Preview
                {preview.source === "fallback" && (
                  <Badge variant="warning">Offline mode — add an AI API key for full AI</Badge>
                )}
              </CardTitle>
              <CardDescription>
                This will be saved with your word. You can edit it later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {preview.pronunciation && (
                <div>
                  <span className="font-medium">Pronunciation: </span>
                  <span className="font-mono text-muted-foreground">{preview.pronunciation}</span>
                </div>
              )}
              {preview.partOfSpeech && (
                <div>
                  <span className="font-medium">Part of speech: </span>
                  <span className="text-muted-foreground">{preview.partOfSpeech}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {preview.synonyms.map((s) => (
                  <Badge key={`s-${s}`} variant="default">
                    {s}
                  </Badge>
                ))}
                {preview.antonyms.map((a) => (
                  <Badge key={`a-${a}`} variant="destructive">
                    {a}
                  </Badge>
                ))}
              </div>
              {preview.examples.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Examples</p>
                  <ul className="space-y-2">
                    {preview.examples.map((ex, i) => (
                      <li key={i} className="rounded-lg bg-muted/50 px-3 py-2">
                        <Badge variant="muted" className="mb-1">
                          {ex.context}
                        </Badge>
                        <p className="text-muted-foreground">{ex.sentence}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save word
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
