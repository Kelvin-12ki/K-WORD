"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarRange, Tag, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { MasteryBadge } from "@/components/mastery";
import { formatRelative } from "@/lib/utils";
import type { WordDTO } from "@/types";

interface JournalGroup {
  key: string;
  label: string;
  items: WordDTO[];
}

export function JournalClient() {
  const [groups, setGroups] = React.useState<JournalGroup[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/journal?limit=50")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Vocabulary Journal"
        description="A social-feed style timeline of everything you've learned."
      />

      {loading ? (
        <div className="mx-auto max-w-2xl space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Your journal is empty"
          description="Every word you add shows up here, grouped by when you learned it."
          action={
            <Link
              href="/words/new"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Add your first word
            </Link>
          }
        />
      ) : (
        <div className="mx-auto max-w-2xl space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-border" />
                <Badge variant="muted">{group.items.length}</Badge>
              </div>

              <div className="space-y-3">
                {group.items.map((w) => (
                  <Link key={w.id} href={`/words/${w.id}`} className="block">
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                                {w.word}
                              </h3>
                              {w.favorite && (
                                <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {w.meaning}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge variant="secondary" className="gap-1">
                              <Tag className="h-3 w-3" /> {w.category}
                            </Badge>
                            <MasteryBadge level={w.masteryLevel} />
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelative(w.createdAt)}
                            </span>
                          </div>
                        </div>
                        {w.aiExamples[0] && (
                          <p className="mt-3 truncate border-l-2 border-accent/40 pl-3 text-xs italic text-muted-foreground">
                            {w.aiExamples[0].sentence}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
