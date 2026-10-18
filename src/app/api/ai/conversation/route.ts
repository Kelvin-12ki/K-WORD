import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError } from "@/lib/session";
import { conversationSchema } from "@/lib/validators";
import { generateConversation, continueConversation } from "@/lib/ai/service";

export const dynamic = "force-dynamic";

/** POST /api/ai/conversation — start or continue a Word Playground conversation */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();

    // Continue mode
    if (body?.mode === "continue") {
      const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
      const topic = String(body.topic ?? "General");
      const wordIds = Array.isArray(body.wordIds) ? body.wordIds.slice(0, 8) : [];

      await connectDB();
      const words = wordIds.length
        ? await Word.find({ userId, _id: { $in: wordIds } })
            .select("word meaning")
            .lean()
        : await Word.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $sample: { size: 5 } },
            { $project: { word: 1, meaning: 1 } },
          ]);

      const result = await continueConversation({
        topic,
        history,
        words: words.map((w) => ({ word: w.word, meaning: w.meaning })),
      });
      return Response.json(result);
    }

    const parsed = conversationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();

    let words: { word: string; meaning: string; _id: unknown }[] = [];
    if (parsed.data.wordIds?.length) {
      words = await Word.find({
        userId,
        _id: { $in: parsed.data.wordIds.filter((id) => mongoose.isValidObjectId(id)) },
      })
        .select("word meaning")
        .lean();
    }
    if (words.length < 3) {
      const extra = await Word.aggregate<{ word: string; meaning: string; _id: unknown }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $sample: { size: 6 } },
        { $project: { word: 1, meaning: 1, _id: 1 } },
      ]);
      const seen = new Set(words.map((w) => w.word));
      for (const e of extra) {
        if (!seen.has(e.word)) words.push(e);
        if (words.length >= 6) break;
      }
    }

    const result = await generateConversation({
      topic: parsed.data.topic,
      turnCount: parsed.data.turnCount,
      words: words.map((w) => ({ word: w.word, meaning: w.meaning })),
    });

    return Response.json({
      ...result,
      wordIds: words.map((w) => String(w._id)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
