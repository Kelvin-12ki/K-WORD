import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User, Word } from "@/models";
import { levelForXP, nextLevelXP, levelProgress } from "@/lib/gamification";
import { isDue } from "@/lib/spaced-repetition";
import type { StatsDTO } from "@/types";
import { startOfDay } from "@/lib/utils";

export async function getStats(userId: string): Promise<StatsDTO> {
  await connectDB();

  const [user, totals] = await Promise.all([
    User.findById(userId).lean(),
    Word.aggregate<{ _id: null; total: number; mastered: number; favorites: number; due: number }>([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          mastered: { $sum: { $cond: [{ $gte: ["$masteryLevel", 5] }, 1, 0] } },
          favorites: { $sum: { $cond: ["$favorite", 1, 0] } },
          due: {
            $sum: {
              $cond: [
                {
                  $lte: [
                    { $ifNull: ["$nextReviewDate", new Date(0)] },
                    new Date(new Date().setHours(0, 0, 0, 0)),
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const t = totals[0] ?? { total: 0, mastered: 0, favorites: 0, due: 0 };
  const xp = user?.xp ?? 0;
  const { level, title } = levelForXP(xp);

  return {
    totalWords: t.total,
    masteredWords: t.mastered,
    favorites: t.favorites,
    streak: user?.streak ?? 0,
    dueToday: t.due,
    xp,
    level,
    levelTitle: title,
    nextLevelXP: nextLevelXP(xp),
    progressToNextLevel: levelProgress(xp),
  };
}

export async function refreshUserCounters(userId: string): Promise<void> {
  await connectDB();
  const [total, mastered, favorites] = await Promise.all([
    Word.countDocuments({ userId }),
    Word.countDocuments({ userId, masteryLevel: { $gte: 5 } }),
    Word.countDocuments({ userId, favorite: true }),
  ]);
  await User.updateOne({ _id: userId }, { $set: { totalWords: total, masteredWords: mastered, favoriteCount: favorites } });
}

export { isDue, startOfDay };
