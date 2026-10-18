import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { updateStreak, XP_REWARDS } from "@/lib/gamification";

/**
 * Applies XP, refreshes the daily streak, and stamps lastActiveDate.
 */
export async function awardXP(userId: string, amount: number): Promise<void> {
  await connectDB();
  const user = await User.findById(userId).select("streak lastActiveDate").lean();
  if (!user) return;

  const streak = updateStreak({ streak: user.streak, lastActiveDate: user.lastActiveDate });
  const streakChanged = streak !== user.streak;

  await User.updateOne(
    { _id: userId },
    {
      $inc: { xp: Math.max(0, amount) },
      $set: { lastActiveDate: new Date(), ...(streakChanged ? { streak } : {}) },
    }
  );
}

export { XP_REWARDS };
