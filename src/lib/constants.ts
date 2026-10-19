export const APP_NAME = "K WORD";
export const APP_TAGLINE = "Your personal language second brain";

export const DEFAULT_CATEGORIES = [
  "Technology",
  "Cybersecurity",
  "Academic",
  "Business",
  "Entrepreneurship",
  "Communication",
  "Leadership",
  "Legal",
  "Finance",
] as const;

export const PLAYGROUND_TOPICS = [
  "Cybersecurity",
  "Technology",
  "Entrepreneurship",
  "Business",
  "Education",
] as const;

export const MASTERY_MAX = 5;
export const MASTERY_LEVEL_LABELS = [
  "New",
  "Familiar",
  "Recognized",
  "Understood",
  "Comfortable",
  "Mastered",
] as const;

export const MASTERY_COLORS = [
  "bg-slate-400",
  "bg-amber-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
] as const;

export const XP_REWARDS = {
  ADD_WORD: 10,
  REVIEW: 5,
  REVIEW_HARD: 7,
  COMPLETE_CHALLENGE: 20,
  CREATE_EXAMPLE: 8,
  PRACTICE_SENTENCE: 6,
  PRACTICE_HIGH_SCORE: 4,
  DAILY_STREAK_BONUS: 15,
} as const;

export const LEVELS = [
  { level: 1, title: "Word Collector", minXP: 0 },
  { level: 2, title: "Language Builder", minXP: 250 },
  { level: 3, title: "Effective Communicator", minXP: 750 },
  { level: 4, title: "Vocabulary Master", minXP: 2000 },
  { level: 5, title: "Wordsmith", minXP: 5000 },
] as const;

export const AI_MODELS = {
  chat: process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
} as const;

/** @deprecated use AI_MODELS */
export const OPENAI_MODELS = AI_MODELS;

export const API_PREFIX = "/api";
