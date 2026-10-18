import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError } from "@/lib/session";
import { serializeWord } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/**
 * GET /api/journal — words grouped by learning timeline (social-feed style).
 */
export async function GET(req: Request) {
  try {
    const { userId } = await requireUser();
    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit") ?? 40)));

    await connectDB();
    const words = await Word.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();

    const groups: { key: string; label: string; items: ReturnType<typeof serializeWord>[] }[] = [];
    const bucket = (d: Date) => {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const diff = Math.floor((start.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
      if (diff <= 0) return { key: "today", label: "Today" };
      if (diff === 1) return { key: "yesterday", label: "Yesterday" };
      if (diff < 7) return { key: "week", label: "This Week" };
      if (diff < 30) return { key: "month", label: "This Month" };
      return { key: "older", label: "Earlier" };
    };

    for (const w of words) {
      const b = bucket(new Date(w.createdAt));
      let g = groups.find((x) => x.key === b.key);
      if (!g) {
        g = { key: b.key, label: b.label, items: [] };
        groups.push(g);
      }
      g.items.push(serializeWord(w as never));
    }

    return Response.json({ groups });
  } catch (err) {
    return handleApiError(err);
  }
}
