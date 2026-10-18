import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createWordSchema = z.object({
  word: z.string().min(1, "Word is required").max(80),
  meaning: z.string().min(1, "Meaning is required").max(1000),
  pronunciation: z.string().max(120).optional(),
  partOfSpeech: z.string().max(60).optional(),
  category: z.string().max(60).optional(),
  learnedFrom: z.string().max(160).optional(),
  notes: z.string().max(2000).optional(),
  exampleSentences: z.array(z.string().max(500)).max(10).optional(),
  enrichWithAI: z.boolean().optional().default(true),
});

export const updateWordSchema = createWordSchema.partial().omit({ enrichWithAI: true }).extend({
  favorite: z.boolean().optional(),
  masteryLevel: z.number().int().min(0).max(5).optional(),
});

export const reviewSchema = z.object({
  wordId: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const practiceSchema = z.object({
  wordId: z.string().min(1),
  sentence: z.string().min(5, "Write a full sentence").max(500),
});

export const exampleSchema = z.object({
  wordId: z.string().min(1),
  text: z.string().min(5, "Example must be at least 5 characters").max(500),
});

export const searchSchema = z.object({
  q: z.string().max(120).optional(),
  category: z.string().max(60).optional(),
  favorite: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest", "az", "mastery", "due"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const enrichSchema = z.object({
  word: z.string().min(1).max(80),
  meaning: z.string().max(1000).optional(),
  category: z.string().max(60).optional(),
});

export const conversationSchema = z.object({
  topic: z.string().min(1).max(60),
  turnCount: z.coerce.number().int().min(3).max(8).default(5),
  wordIds: z.array(z.string()).max(10).optional(),
});

export const analyzeSchema = z.object({
  text: z.string().min(20, "Paste at least a few sentences").max(12000),
  type: z.enum(["essay", "report", "email", "linkedin", "general"]).default("general"),
});

export const extensionSaveSchema = z.object({
  apiKey: z.string().min(1),
  word: z.string().min(1).max(80),
  meaning: z.string().max(1000).optional(),
  context: z.string().max(1000).optional(),
  sourceUrl: z.string().max(500).optional(),
});

export type CreateWordInput = z.infer<typeof createWordSchema>;
export type UpdateWordInput = z.infer<typeof updateWordSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
