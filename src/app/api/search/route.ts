import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError } from "@/lib/session";
import { serializeWord } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=... — instant client-side search endpoint.
 * Matches word, meaning, category, synonyms, notes, learnedFrom.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await requireUser();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

    await connectDB();

    if (!q) {
      const recent = await Word.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
      return Response.json({ items: recent.map((w) => serializeWord(w as never)), total: recent.length });
    }

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const items = await Word.find({
      userId,
      $or: [
        { word: rx },
        { meaning: rx },
        { category: rx },
        { notes: rx },
        { synonyms: rx },
        { antonyms: rx },
        { learnedFrom: rx },
        { exampleSentences: rx },
      ],
    })
      .sort({ word: 1 })
      .limit(limit)
      .lean();

    return Response.json({ items: items.map((w) => serializeWord(w as never)), total: items.length });
  } catch (err) {
    return handleApiError(err);
  }
}
