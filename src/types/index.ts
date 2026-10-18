import type { DefaultSession } from "next-auth";

export type MasteryRating = "easy" | "medium" | "hard";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

export interface AiExample {
  context: string;
  sentence: string;
}

export interface WordDTO {
  id: string;
  userId: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  synonyms: string[];
  antonyms: string[];
  category: string;
  learnedFrom?: string;
  notes?: string;
  exampleSentences: string[];
  aiExamples: AiExample[];
  masteryLevel: number;
  reviewCount: number;
  favorite: boolean;
  nextReviewDate?: string | null;
  lastReviewedAt?: string | null;
  totalPractices: number;
  correctPractices: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDTO {
  id: string;
  wordId: string;
  word?: string;
  score: number;
  difficulty: MasteryRating;
  reviewDate: string;
  nextReviewDate: string;
}

export interface ChallengeDTO {
  id: string;
  wordId: string;
  word?: string;
  completed: boolean;
  challengeDate: string;
}

export interface PracticeAttemptDTO {
  id: string;
  wordId: string;
  sentence: string;
  score: number;
  grammarScore: number;
  naturalnessScore: number;
  contextScore: number;
  feedback: string;
  suggestion?: string;
  createdAt: string;
}

export interface UserExampleDTO {
  id: string;
  wordId: string;
  word?: string;
  text: string;
  createdAt: string;
}

export interface StatsDTO {
  totalWords: number;
  masteredWords: number;
  favorites: number;
  streak: number;
  dueToday: number;
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXP: number;
  progressToNextLevel: number;
}

export interface ApiError {
  error: string;
}
