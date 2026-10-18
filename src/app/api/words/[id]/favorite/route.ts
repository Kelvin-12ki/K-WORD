import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Word } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { serializeWord } from "@/lib/serializers";
import { refreshUserCounters } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** POST /api/words/:id/favorite — toggle favorite */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError("Invalid word id", 400);

    await connectDB();
    const word = await Word.findOne({ _id: id, userId });
    if (!word) throw new ApiError("Word not found", 404);

    word.favorite = !word.favorite;
    await word.save();
    await refreshUserCounters(userId);

    return Response.json({ word: serializeWord(word), favorite: word.favorite });
  } catch (err) {
    return handleApiError(err);
  }
}
