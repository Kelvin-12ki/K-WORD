import mongoose from "mongoose";
import { Word, Review, Challenge } from "@/models";
import { requireUser, handleApiError } from "@/lib/session";
import { getStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats — dashboard aggregates
 * ?range=30|90  growth window in days
 */
export async function GET(req: Request) {
  try {
    const { userId } = await requireUser();
    const url = new URL(req.url);
    const rangeDays = Math.min(365, Math.max(7, Number(url.searchParams.get("range") ?? 30)));

    const [stats, growthRaw, weeklyRaw, masteryRaw, categoryRaw, recentReviews] =
      await Promise.all([
        getStats(userId),
        Word.aggregate<{ _id: string; count: number }>([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: new Date(Date.now() - rangeDays * 86400000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Review.aggregate<{ _id: string; count: number; easy: number }>([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              reviewDate: { $gte: new Date(Date.now() - 14 * 86400000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewDate" } },
              count: { $sum: 1 },
              easy: { $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Word.aggregate<{ _id: number; count: number }>([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: "$masteryLevel", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Word.aggregate<{ _id: string; count: number }>([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        Review.find({ userId })
          .sort({ reviewDate: -1 })
          .limit(8)
          .populate("wordId", "word")
          .lean(),
      ]);

    // Build continuous growth series
    const growth: { date: string; total: number; added: number }[] = [];
    const map = new Map(growthRaw.map((g) => [g._id, g.count]));
    let running = await Word.countDocuments({
      userId,
      createdAt: { $lt: new Date(Date.now() - rangeDays * 86400000) },
    });
    for (let i = rangeDays; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const added = map.get(key) ?? 0;
      running += added;
      if (i % Math.max(1, Math.floor(rangeDays / 30)) === 0 || i === 0) {
        growth.push({ date: key, total: running, added });
      }
    }

    const weekDays: { date: string; label: string; reviews: number; easy: number }[] = [];
    const wmap = new Map(weeklyRaw.map((w) => [w._id, w]));
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const row = wmap.get(key);
      weekDays.push({
        date: key,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        reviews: row?.count ?? 0,
        easy: row?.easy ?? 0,
      });
    }

    const challengeCount = await Challenge.countDocuments({ userId, completed: true });

    return Response.json({
      stats,
      growth,
      weekly: weekDays,
      mastery: masteryRaw.map((m) => ({ level: m._id, count: m.count })),
      categories: categoryRaw.map((c) => ({ name: c._id, count: c.count })),
      challengeCount,
      recentReviews: recentReviews.map((r) => ({
        word: (r.wordId as unknown as { word?: string })?.word ?? "—",
        difficulty: r.difficulty,
        date: r.reviewDate,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
