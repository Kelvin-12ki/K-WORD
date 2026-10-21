import { requireUser, handleApiError, ApiError } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { PushSubscription } from "@/models";

export const dynamic = "force-dynamic";

interface UnsubscribeBody {
  endpoint?: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { userId } = await requireUser();
    const body = (await req.json()) as UnsubscribeBody;
    const endpoint = body?.endpoint?.trim();

    if (!endpoint) throw new ApiError("Missing endpoint", 400);

    await connectDB();
    await PushSubscription.deleteOne({ endpoint, userId });

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
