import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { PushSubscription } from "@/models";
import { pushConfigured } from "@/lib/push/server";

export const dynamic = "force-dynamic";

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    if (!pushConfigured()) {
      throw new ApiError("Push notifications are not configured on this deployment", 503);
    }

    const { userId } = await requireUser();
    const body = (await req.json()) as SubscribeBody;

    const endpoint = body?.endpoint?.trim();
    const p256dh = body?.keys?.p256dh?.trim();
    const auth = body?.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      throw new ApiError("Invalid subscription payload", 400);
    }

    await connectDB();

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          userId,
          endpoint,
          p256dh,
          auth,
          userAgent: body?.userAgent?.slice(0, 300),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
