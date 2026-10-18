import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word, Challenge } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { serializeChallenge, serializeWord } from "@/lib/serializers";
import { awardXP, XP_REWARDS } from "@/lib/activity";
import { startOfDay } from "@/lib/utils";
import type { IWord } from "@/models";

export const dynamic = "force-dynamic";

async function getOrCreateToday(userId: string) {
  const today = startOfDay();
  const existing = await Challenge.findOne({ userId, challengeDate: today })
    .populate<{ wordId: IWord }>("wordId")
    .lean();
  if (existing?.wordId && (existing.wordId as IWord).word) {
    return { challenge: existing, word: existing.wordId as unknown as IWord };
  }

  const total = await Word.countDocuments({ userId });
  if (total === 0) return { challenge: null, word: null };

  const [picked] = await Word.aggregate<IWord>([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sample: { size: 1 } },
  ]);
  if (!picked) return { challenge: null, word: null };

  const challenge = await Challenge.findOneAndUpdate(
    { userId, challengeDate: today },
    { $setOnInsert: { wordId: picked._id, completed: false } },
    { upsert: true, new: true }
  ).lean();

  return { challenge, word: picked };
}

/** GET /api/challenges/today */
export async function GET() {
  try {
    const { userId } = await requireUser();
    await connectDB();

    const { word, challenge } = await getOrCreateToday(userId);
    const history = await Challenge.find({ userId, completed: true })
      .sort({ challengeDate: -1 })
      .limit(14)
      .populate("wordId", "word")
      .lean();

    return Response.json({
      word: word ? serializeWord(word) : null,
      completed: Boolean(challenge?.completed),
      history: history.map((c) =>
        serializeChallenge(c as never, (c.wordId as unknown as { word?: string })?.word)
      ),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/challenges/complete */
export async function POST() {
  try {
    const { userId } = await requireUser();
    await connectDB();

    const { challenge, word } = await getOrCreateToday(userId);
    if (!word || !challenge) throw new ApiError("Add a word first to start today's challenge", 400);

    if (challenge.completed) {
      return Response.json({ ok: true, alreadyCompleted: true });
    }

    await Challenge.updateOne({ _id: challenge._id }, { $set: { completed: true } });
    await awardXP(userId, XP_REWARDS.COMPLETE_CHALLENGE);

    return Response.json({ ok: true, word: serializeWord(word) });
  } catch (err) {
    return handleApiError(err);
  }
}
