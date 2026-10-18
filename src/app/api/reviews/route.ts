import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word, Review } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { reviewSchema } from "@/lib/validators";
import { serializeReview, serializeWord } from "@/lib/serializers";
import { scheduleReview } from "@/lib/spaced-repetition";
import { refreshUserCounters } from "@/lib/stats";
import { awardXP, XP_REWARDS } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** GET /api/reviews?due=true — due words + recent history */
export async function GET(req: Request) {
  try {
    const { userId } = await requireUser();
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "due";

    await connectDB();

    if (mode === "history") {
      const history = await Review.find({ userId })
        .sort({ reviewDate: -1 })
        .limit(50)
        .populate("wordId", "word")
        .lean();
      return Response.json({
        items: history.map((r) =>
          serializeReview(r as never, (r.wordId as unknown as { word?: string })?.word)
        ),
      });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const words = await Word.find({ userId, nextReviewDate: { $lte: start } })
      .sort({ nextReviewDate: 1 })
      .limit(50)
      .lean();

    return Response.json({
      items: words.map((w) => serializeWord(w as never)),
      total: words.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/reviews — submit a review rating */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(parsed.data.wordId)) {
      throw new ApiError("Invalid word id", 400);
    }

    await connectDB();
    const word = await Word.findOne({ _id: parsed.data.wordId, userId });
    if (!word) throw new ApiError("Word not found", 404);

    const { difficulty } = parsed.data;
    const result = scheduleReview(word.masteryLevel ?? 0, difficulty, word.reviewCount ?? 0);
    const score = difficulty === "easy" ? 3 : difficulty === "medium" ? 2 : 1;

    word.masteryLevel = result.masteryLevel;
    word.reviewCount = result.reviewCount;
    word.nextReviewDate = result.nextReviewDate;
    word.lastReviewedAt = result.lastReviewedAt;
    word.intervalDays = result.intervalDays;
    await word.save();

    const review = await Review.create({
      userId,
      wordId: word._id,
      score,
      difficulty,
      reviewDate: new Date(),
      nextReviewDate: result.nextReviewDate,
    });

    await Promise.all([
      refreshUserCounters(userId),
      awardXP(userId, difficulty === "hard" ? XP_REWARDS.REVIEW_HARD : XP_REWARDS.REVIEW),
    ]);

    return Response.json({
      review: serializeReview(review, word.word),
      word: serializeWord(word),
      result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
