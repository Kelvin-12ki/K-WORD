import { cn } from "@/lib/utils";
import { MASTERY_LEVEL_LABELS } from "@/lib/constants";

const COLORS = [
  "bg-slate-400/20 text-slate-500 dark:text-slate-400 border-slate-400/30",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
];

export function MasteryBadge({ level, className }: { level: number; className?: string }) {
  const idx = Math.max(0, Math.min(5, level));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        COLORS[idx],
        className
      )}
    >
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-1 rounded-full",
              i <= idx ? "bg-current" : "bg-current opacity-25"
            )}
          />
        ))}
      </span>
      {MASTERY_LEVEL_LABELS[idx]}
    </span>
  );
}

export function MasteryBar({ level, className }: { level: number; className?: string }) {
  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i <= level ? COLORS[Math.min(5, level)].split(" ")[0] : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
