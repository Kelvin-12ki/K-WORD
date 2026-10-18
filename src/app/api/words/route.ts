import { connectDB } from "@/lib/db";
import { Word, User } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { createWordSchema } from "@/lib/validators";
import { serializeWord } from "@/lib/serializers";
import { enrichWord } from "@/lib/ai/service";
import { refreshUserCounters } from "@/lib/stats";
import { awardXP, XP_REWARDS } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** GET /api/words — list/search current user's words */
export async function GET(req: Request) {
  try {
    const { userId } = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const category = url.searchParams.get("category");
    const favorite = url.searchParams.get("favorite");
    const due = url.searchParams.get("due");
    const sort = url.searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 24)));

    const filter: Record<string, unknown> = { userId };
    if (category && category !== "All") filter.category = category;
    if (favorite === "true") filter.favorite = true;
    if (due === "true") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.nextReviewDate = { $lte: start };
    }
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { word: rx },
        { meaning: rx },
        { notes: rx },
        { category: rx },
        { synonyms: rx },
        { antonyms: rx },
        { learnedFrom: rx },
      ];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      az: { word: 1 },
      mastery: { masteryLevel: -1 },
      due: { nextReviewDate: 1 },
    };

    await connectDB();
    const [items, total] = await Promise.all([
      Word.find(filter)
        .sort(sortMap[sort] ?? sortMap.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Word.countDocuments(filter),
    ]);

    return Response.json({
      items: items.map((w) => serializeWord(w as never)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/words — create a word (with optional AI enrichment) */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const parsed = createWordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const wordLower = data.word.trim().toLowerCase();

    await connectDB();

    const existing = await Word.findOne({ userId, word: new RegExp(`^${wordLower}$`, "i") });
    if (existing) {
      throw new ApiError(`"${data.word}" is already in your vocabulary bank`, 409);
    }

    const category =
      data.category && data.category.trim().length > 0 ? data.category.trim() : "General";

    const enrichment =
      data.enrichWithAI !== false
        ? await enrichWord({ word: data.word.trim(), meaning: data.meaning, category })
        : null;

    const word = await Word.create({
      userId,
      word: data.word.trim(),
      meaning: enrichment?.refinedMeaning || data.meaning,
      pronunciation: data.pronunciation || enrichment?.pronunciation,
      partOfSpeech: data.partOfSpeech || enrichment?.partOfSpeech,
      synonyms: enrichment?.synonyms ?? [],
      antonyms: enrichment?.antonyms ?? [],
      category,
      learnedFrom: data.learnedFrom,
      notes: data.notes,
      exampleSentences: data.exampleSentences ?? [],
      aiExamples: enrichment?.examples ?? [],
      masteryLevel: 0,
      reviewCount: 0,
      favorite: false,
      nextReviewDate: new Date(),
    });

    await Promise.all([
      refreshUserCounters(userId),
      awardXP(userId, XP_REWARDS.ADD_WORD),
      User.updateOne(
        { _id: userId },
        { $addToSet: { customCategories: { $each: category === "General" ? [] : [category] } } }
      ),
    ]);

    return Response.json({ word: serializeWord(word), enriched: Boolean(enrichment) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
