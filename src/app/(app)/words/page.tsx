import { Suspense } from "react";
import { WordsPageClient } from "./words-client";

export const metadata = { title: "My Words" };

export default function WordsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      }
    >
      <WordsPageClient />
    </Suspense>
  );
}
