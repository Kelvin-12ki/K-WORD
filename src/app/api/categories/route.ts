import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User, Word } from "@/models";
import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET /api/categories — default + custom categories with counts */
export async function GET() {
  try {
    const { userId } = await requireUser();
    await connectDB();

    const [user, counts] = await Promise.all([
      User.findById(userId).lean(),
      Word.aggregate<{ _id: string; count: number }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const custom = user?.customCategories ?? [];
    const all = [...new Set([...DEFAULT_CATEGORIES, ...custom, ...counts.map((c) => c._id)])];

    return Response.json({
      categories: all.map((name) => ({
        name,
        count: counts.find((c) => c._id === name)?.count ?? 0,
        isDefault: (DEFAULT_CATEGORIES as readonly string[]).includes(name),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/categories — add a custom category */
export async function POST(req: Request) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    if (!name || name.length > 60) throw new ApiError("Category name is required", 400);

    await connectDB();
    await User.updateOne({ _id: userId }, { $addToSet: { customCategories: name } });
    return Response.json({ name }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
