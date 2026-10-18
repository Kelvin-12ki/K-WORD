export type MasteryRating = "easy" | "medium" | "hard";

export interface SpacedRepetitionResult {
  masteryLevel: number;
  reviewCount: number;
  nextReviewDate: Date;
  lastReviewedAt: Date;
  intervalDays: number;
  mastered: boolean;
}

export const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

export function intervalForLevel(level: number): number {
  const idx = Math.max(0, Math.min(INTERVALS.length - 1, level));
  return INTERVALS[idx];
}

/**
 * SM-2 inspired scheduler tuned to the K WORD interval ladder.
 * easy   -> jump +2 levels, medium -> +1 level, hard -> -1 level (re-study tomorrow).
 */
export function scheduleReview(
  currentLevel: number,
  rating: MasteryRating,
  reviewCount: number
): SpacedRepetitionResult {
  const now = new Date();
  const count = reviewCount + 1;
  let nextLevel: number;

  switch (rating) {
    case "easy":
      nextLevel = currentLevel + 2;
      break;
    case "medium":
      nextLevel = currentLevel + 1;
      break;
    case "hard":
      nextLevel = Math.max(0, currentLevel - 1);
      break;
  }

  nextLevel = Math.max(0, Math.min(INTERVALS.length - 1, nextLevel));
  const intervalDays = rating === "hard" ? 1 : intervalForLevel(nextLevel);
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    masteryLevel: nextLevel,
    reviewCount: count,
    nextReviewDate,
    lastReviewedAt: now,
    intervalDays,
    mastered: nextLevel >= INTERVALS.length - 1,
  };
}

export function isDue(nextReviewDate: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!nextReviewDate) return true;
  const d = new Date(nextReviewDate);
  d.setHours(0, 0, 0, 0);
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return d.getTime() <= t.getTime();
}
