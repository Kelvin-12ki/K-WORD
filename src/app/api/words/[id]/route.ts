import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { updateWordSchema } from "@/lib/validators";
import { serializeWord } from "@/lib/serializers";
import { refreshUserCounters } from "@/lib/stats";

export const dynamic = "force-dynamic";

async function loadOwnWord(userId: string, id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid word id", 400);
  await connectDB();
  const word = await Word.findOne({ _id: id, userId });
  if (!word) throw new ApiError("Word not found", 404);
  return word;
}

/** GET /api/words/:id */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    const word = await loadOwnWord(userId, id);
    return Response.json({ word: serializeWord(word) });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/words/:id */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    const word = await loadOwnWord(userId, id);

    const body = await req.json();
    const parsed = updateWordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const before = word.favorite;

    if (data.word !== undefined) word.word = data.word.trim();
    if (data.meaning !== undefined) word.meaning = data.meaning;
    if (data.pronunciation !== undefined) word.pronunciation = data.pronunciation;
    if (data.partOfSpeech !== undefined) word.partOfSpeech = data.partOfSpeech;
    if (data.category !== undefined) word.category = data.category.trim() || "General";
    if (data.learnedFrom !== undefined) word.learnedFrom = data.learnedFrom;
    if (data.notes !== undefined) word.notes = data.notes;
    if (data.exampleSentences !== undefined) word.exampleSentences = data.exampleSentences;
    if (data.favorite !== undefined) word.favorite = data.favorite;
    if (data.masteryLevel !== undefined) word.masteryLevel = data.masteryLevel;

    await word.save();
    if (before !== word.favorite) await refreshUserCounters(userId);

    return Response.json({ word: serializeWord(word) });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/words/:id */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    const word = await loadOwnWord(userId, id);
    await word.deleteOne();
    await refreshUserCounters(userId);
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
