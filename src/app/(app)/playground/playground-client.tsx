"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessagesSquare, Send, Loader2, RotateCcw, Bot, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAYGROUND_TOPICS } from "@/lib/constants";

interface Turn {
  speaker: "ai" | "user";
  text: string;
}

export function PlaygroundClient() {
  const [topic, setTopic] = React.useState<string>(PLAYGROUND_TOPICS[0]);
  const [history, setHistory] = React.useState<Turn[]>([]);
  const [targetWords, setTargetWords] = React.useState<string[]>([]);
  const [wordIds, setWordIds] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function start() {
    setLoading(true);
    setHistory([]);
    try {
      const res = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, turnCount: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHistory([{ speaker: "ai", text: data.opening }]);
      setTargetWords(data.targetWords ?? []);
      setWordIds(data.wordIds ?? []);
      setStarted(true);
      if (data.source === "fallback") {
        toast.info("Running in offline mode — add OPENAI_API_KEY for full AI conversations");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start conversation");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    const userTurn: Turn = { speaker: "user", text: draft.trim() };
    const nextHistory = [...history, userTurn];
    setHistory(nextHistory);
    setDraft("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "continue", topic, history: nextHistory, wordIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHistory((h) => [...h, { speaker: "ai", text: data.reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reply failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Word Playground"
        description="Hold realistic conversations that force active recall of your saved vocabulary."
        actions={
          <Button variant="outline" onClick={start} disabled={loading}>
            {started ? <RotateCcw className="h-4 w-4" /> : <MessagesSquare className="h-4 w-4" />}
            {started ? "Restart" : "Start conversation"}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {PLAYGROUND_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              topic === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {targetWords.length > 0 && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vocabulary in play:
            </span>
            {targetWords.map((w) => (
              <Badge key={w} variant="accent">
                {w}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="flex h-[520px] flex-col">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
            {!started && !loading && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessagesSquare className="h-6 w-6" />
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Choose a topic and start a conversation. The AI partner will naturally weave in
                  your saved words — your job is to keep using them.
                </p>
                <Button className="mt-5" onClick={start} disabled={loading}>
                  Start {topic} conversation
                </Button>
              </div>
            )}

            {history.map((turn, i) => (
              <div
                key={i}
                className={`flex gap-3 ${turn.speaker === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    turn.speaker === "ai" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                  }`}
                >
                  {turn.speaker === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    turn.speaker === "ai"
                      ? "rounded-tl-sm bg-muted"
                      : "rounded-tr-sm bg-primary text-primary-foreground"
                  }`}
                >
                  {turn.text}
                </div>
              </div>
            ))}

            {loading && started && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {started && (
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <Textarea
                  rows={2}
                  placeholder="Reply using your vocabulary…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <Button onClick={send} disabled={loading || !draft.trim()} className="h-[64px] px-4">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
