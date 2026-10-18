import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { handleApiError, ApiError } from "@/lib/session";
import { enrichWord } from "@/lib/ai/service";
import { refreshUserCounters } from "@/lib/stats";
import { awardXP, XP_REWARDS } from "@/lib/activity";

export const dynamic = "force-dynamic";

/**
 * POST /api/extension/save
 * Public endpoint used by the (future) browser extension.
 * Auth: X-API-Key header with the user's extension API key.
 * Body: { word, meaning?, context?, sourceUrl? }
 */
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key") ?? "";
    if (!apiKey) throw new ApiError("Missing X-API-Key header", 401);

    const { User } = await import("@/models");
    await connectDB();
    const user = await User.findOne({ extensionApiKey: apiKey }).select("+extensionApiKey");
    if (!user) throw new ApiError("Invalid API key", 401);
    const userId = user._id.toString();

    const body = await req.json().catch(() => ({}));
    const word = String(body?.word ?? "").trim();
    const meaning = String(body?.meaning ?? "").trim();
    const context = String(body?.context ?? "").trim();
    const sourceUrl = String(body?.sourceUrl ?? "").trim();

    if (!word || word.length > 80) throw new ApiError("A valid word is required", 400);

    const existing = await Word.findOne({ userId, word: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (existing) {
      return Response.json({ ok: true, duplicate: true, id: existing._id.toString() });
    }

    const enrichment = meaning
      ? null
      : await enrichWord({ word, category: sourceUrl ? "Captured" : "General" });

    const created = await Word.create({
      userId,
      word,
      meaning: meaning || enrichment?.refinedMeaning || `Captured from ${sourceUrl || "the web"}.`,
      pronunciation: enrichment?.pronunciation,
      partOfSpeech: enrichment?.partOfSpeech,
      synonyms: enrichment?.synonyms ?? [],
      antonyms: enrichment?.antonyms ?? [],
      category: "Captured",
      learnedFrom: sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : "Browser extension",
      notes: context || undefined,
      aiExamples: enrichment?.examples ?? [],
      nextReviewDate: new Date(),
    });

    await Promise.all([refreshUserCounters(userId), awardXP(userId, XP_REWARDS.ADD_WORD)]);

    return Response.json({ ok: true, id: created._id.toString(), word: created.word }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

/** GET /api/extension/save — docs ping */
export async function GET() {
  return Response.json({
    service: "K WORD Extension API",
    version: "1.0.0",
    endpoints: {
      "POST /api/extension/save": "Save a highlighted word. Header: X-API-Key",
      "GET /api/extension/save?docs=1": "This document",
    },
  });
}
