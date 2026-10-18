"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Volume2, MoreVertical, Trash2, Pencil, CalendarClock, Tag } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MasteryBadge } from "@/components/mastery";
import type { WordDTO } from "@/types";
import { formatRelative } from "@/lib/utils";

export function WordCard({ word, onChanged }: { word: WordDTO; onChanged?: (w: WordDTO) => void }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function toggleFavorite() {
    try {
      const res = await fetch(`/api/words/${word.id}/favorite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChanged?.({ ...word, favorite: data.favorite });
      toast.success(data.favorite ? "Added to favorites" : "Removed from favorites");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word.word);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/words/${word.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(`"${word.word}" deleted`);
      router.refresh();
    } catch {
      toast.error("Could not delete word");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Card className="group relative flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/words/${word.id}`} className="min-w-0">
              <h3 className="truncate text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                {word.word}
              </h3>
              {word.pronunciation && (
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {word.pronunciation}
                </p>
              )}
            </Link>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Pronounce"
                onClick={speak}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Favorite"
                onClick={toggleFavorite}
              >
                <Star
                  className={word.favorite ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/words/${word.id}`)}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {word.meaning}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" /> {word.category}
            </Badge>
            {word.partOfSpeech && <Badge variant="muted">{word.partOfSpeech}</Badge>}
            <MasteryBadge level={word.masteryLevel} />
          </div>

          {word.synonyms.length > 0 && (
            <p className="mt-3 truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Syn:</span> {word.synonyms.slice(0, 4).join(", ")}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Review {formatRelative(word.nextReviewDate)}
            </span>
            <span>Added {formatRelative(word.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &quot;{word.word}&quot;?</DialogTitle>
            <DialogDescription>
              This permanently removes the word, its review history and examples. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
