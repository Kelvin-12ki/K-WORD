import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word, PracticeAttempt } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { practiceSchema } from "@/lib/validators";
import { serializePractice } from "@/lib/serializers";
import { evaluateSentence } from "@/lib/ai/service";
import { awardXP, XP_REWARDS } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** GET /api/words/:id/practice — attempt history */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid word id", 400);

    await connectDB();
    const attempts = await PracticeAttempt.find({ userId, wordId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return Response.json({ items: attempts.map((a) => serializePractice(a as never)) });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/words/:id/practice — AI-evaluate a sentence */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid word id", 400);

    const body = await req.json();
    const parsed = practiceSchema.safeParse({ ...body, wordId: id });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();
    const word = await Word.findOne({ _id: id, userId });
    if (!word) throw new ApiError("Word not found", 404);

    const evaluation = await evaluateSentence({
      word: word.word,
      meaning: word.meaning,
      sentence: parsed.data.sentence,
    });

    const attempt = await PracticeAttempt.create({
      userId,
      wordId: id,
      sentence: parsed.data.sentence,
      score: evaluation.score,
      grammarScore: evaluation.grammarScore,
      naturalnessScore: evaluation.naturalnessScore,
      contextScore: evaluation.contextScore,
      feedback: evaluation.feedback,
      suggestion: evaluation.suggestion,
    });

    word.totalPractices = (word.totalPractices ?? 0) + 1;
    if (evaluation.score >= 7) word.correctPractices = (word.correctPractices ?? 0) + 1;
    await word.save();

    const bonus = evaluation.score >= 8 ? XP_REWARDS.PRACTICE_HIGH_SCORE : 0;
    await awardXP(userId, XP_REWARDS.PRACTICE_SENTENCE + bonus);

    return Response.json({
      attempt: serializePractice(attempt),
      source: evaluation.source,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
