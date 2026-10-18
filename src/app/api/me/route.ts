import { requireUser, handleApiError } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User, Word } from "@/models";

export const dynamic = "force-dynamic";

/** GET /api/me — current user profile + counters */
export async function GET() {
  try {
    const { userId } = await requireUser();
    await connectDB();
    const [user, total] = await Promise.all([
      User.findById(userId).lean(),
      Word.countDocuments({ userId }),
    ]);
    if (!user) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        streak: user.streak,
        totalWords: user.totalWords,
        masteredWords: user.masteredWords,
        xp: user.xp,
        level: user.level,
        provider: user.provider,
        createdAt: user.createdAt,
      },
      total,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
