import { LEVELS, XP_REWARDS } from "@/lib/constants";
import type { IUser } from "@/models";

export function levelForXP(xp: number): { level: number; title: string } {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l;
  }
  return { level: current.level, title: current.title };
}

export function nextLevelXP(xp: number): number {
  const { level } = levelForXP(xp);
  const next = LEVELS.find((l) => l.level === level + 1);
  return next ? next.minXP : xp;
}

export function levelProgress(xp: number): number {
  const { level } = levelForXP(xp);
  const currentMin = LEVELS.find((l) => l.level === level)?.minXP ?? 0;
  const nextMin = nextLevelXP(xp);
  if (nextMin === currentMin) return 100;
  return Math.min(100, Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100));
}

/**
 * Updates the daily streak. Same calendar day -> unchanged.
 * Yesterday -> +1. More than a day gap -> reset to 1.
 */
export function updateStreak(user: Pick<IUser, "streak" | "lastActiveDate">, today = new Date()): number {
  const last = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (!last) return 1;

  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);
  const todayDay = new Date(today);
  todayDay.setHours(0, 0, 0, 0);

  const diff = Math.round((todayDay.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return user.streak || 1;
  if (diff === 1) return (user.streak || 0) + 1;
  return 1;
}

export { XP_REWARDS };
