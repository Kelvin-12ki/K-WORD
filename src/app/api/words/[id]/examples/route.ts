import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word, UserExample } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { exampleSchema } from "@/lib/validators";
import { serializeExample } from "@/lib/serializers";
import { awardXP, XP_REWARDS } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** GET /api/words/:id/examples */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid word id", 400);

    await connectDB();
    const examples = await UserExample.find({ userId, wordId: id }).sort({ createdAt: -1 }).lean();
    return Response.json({ items: examples.map((e) => serializeExample(e as never)) });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/words/:id/examples — add personal example */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid word id", 400);

    const body = await req.json();
    const parsed = exampleSchema.safeParse({ ...body, wordId: id });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();
    const word = await Word.findOne({ _id: id, userId });
    if (!word) throw new ApiError("Word not found", 404);

    const example = await UserExample.create({
      userId,
      wordId: id,
      text: parsed.data.text.trim(),
    });

    await awardXP(userId, XP_REWARDS.CREATE_EXAMPLE);

    return Response.json({ example: serializeExample(example, word.word) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
