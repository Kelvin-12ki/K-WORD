"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PlusCircle, Library, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { WordCard } from "@/components/words/word-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WordDTO } from "@/types";

interface CategoryOption {
  name: string;
  count: number;
}

function WordsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-4 h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function WordsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = React.useState<WordDTO[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "All";
  const sort = searchParams.get("sort") ?? "newest";
  const favorite = searchParams.get("favorite") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  const setParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All") params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.replace(`/words?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ q, category, sort, page: String(page), limit: "24" });
    if (favorite) params.set("favorite", favorite);
    fetch(`/api/words?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
          setPages(data.pages ?? 1);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, category, sort, favorite, page]);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My Words"
        description={`${total} word${total === 1 ? "" : "s"} in your bank`}
        actions={
          <Button asChild>
            <Link href="/words/new">
              <PlusCircle className="h-4 w-4" /> Add word
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <SearchInput
          className="min-w-[220px] flex-1"
          placeholder="Search word, meaning, synonym, notes…"
          onSearch={(value) => setParam("q", value)}
        />
        <Select value={category} onValueChange={(v) => setParam("category", v)}>
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="h-3.5 w-3.5 opacity-50" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="az">A → Z</SelectItem>
            <SelectItem value="mastery">Mastery</SelectItem>
            <SelectItem value="due">Due first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <WordsGridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Library}
          title={q ? "No words match your search" : "No words yet"}
          description={
            q
              ? "Try a different keyword or clear filters."
              : "Capture your first word — AI will enrich it with definition, synonyms and examples."
          }
          action={
            <Button asChild>
              <Link href="/words/new">
                <PlusCircle className="h-4 w-4" /> Add word
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
                setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setParam("page", String(page - 1))}
          >
            Previous
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setParam("page", String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
