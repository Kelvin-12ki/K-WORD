import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { requireUser, handleApiError } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/extension/key — fetch or mint the user's extension API key */
export async function GET() {
  try {
    const { userId } = await requireUser();
    await connectDB();

    const user = await User.findById(userId).select("+extensionApiKey").lean();
    let key = user?.extensionApiKey;

    if (!key) {
      key = `kw_${crypto.randomBytes(24).toString("hex")}`;
      await User.updateOne({ _id: userId }, { $set: { extensionApiKey: key } });
    }

    return Response.json({ apiKey: key });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/extension/key — regenerate */
export async function POST() {
  try {
    const { userId } = await requireUser();
    const key = `kw_${crypto.randomBytes(24).toString("hex")}`;
    await connectDB();
    await User.updateOne({ _id: userId }, { $set: { extensionApiKey: key } });
    return Response.json({ apiKey: key });
  } catch (err) {
    return handleApiError(err);
  }
}
