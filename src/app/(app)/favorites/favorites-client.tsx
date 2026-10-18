"use client";

import * as React from "react";
import Link from "next/link";
import { Star, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { WordCard } from "@/components/words/word-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { WordDTO } from "@/types";

export function FavoritesClient() {
  const [items, setItems] = React.useState<WordDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/words?favorite=true&sort=az&limit=60&q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => !cancelled && setItems(d.items ?? []))
        .finally(() => !cancelled && setLoading(false));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Favorite Words"
        description="Your starred vocabulary — the words you want front of mind."
      />

      <div className="mb-5 max-w-md">
        <SearchInput placeholder="Search favorites…" onSearch={setQ} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl border border-border bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Star}
          title={q ? "No matching favorites" : "No favorites yet"}
          description="Star a word from your library to pin it here for quick access."
          action={
            <Button asChild>
              <Link href="/words">
                <PlusCircle className="h-4 w-4" /> Browse words
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              onChanged={(updated) =>
                setItems((prev) =>
                  updated.favorite ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev.filter((p) => p.id !== updated.id)
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
