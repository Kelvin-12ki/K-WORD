import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError } from "@/lib/session";
import { analyzeSchema } from "@/lib/validators";
import { analyzeWriting } from "@/lib/ai/service";

export const dynamic = "force-dynamic";

/** POST /api/ai/analyze — AI writing assistant */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();
    const savedWords = await Word.find({ userId })
      .select("word meaning")
      .sort({ masteryLevel: -1 })
      .limit(120)
      .lean();

    const result = await analyzeWriting({
      text: parsed.data.text,
      type: parsed.data.type,
      savedWords: savedWords.map((w) => ({ word: w.word, meaning: w.meaning })),
    });

    return Response.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
