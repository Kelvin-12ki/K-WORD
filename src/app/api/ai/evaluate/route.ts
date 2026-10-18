import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { practiceSchema } from "@/lib/validators";
import { evaluateSentence } from "@/lib/ai/service";

export const dynamic = "force-dynamic";

/** POST /api/ai/evaluate — evaluate a sentence without persisting */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const parsed = practiceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(parsed.data.wordId)) throw new ApiError("Invalid word id", 400);
    await connectDB();
    const word = await Word.findOne({ _id: parsed.data.wordId, userId });
    if (!word) throw new ApiError("Word not found", 404);

    const result = await evaluateSentence({
      word: word.word,
      meaning: word.meaning,
      sentence: parsed.data.sentence,
    });

    return Response.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
