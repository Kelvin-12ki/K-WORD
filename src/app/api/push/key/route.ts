import { requireUser, handleApiError } from "@/lib/session";
import { pushConfigured } from "@/lib/push/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await requireUser();
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!pushConfigured() || !publicKey) {
      return Response.json({ enabled: false });
    }
    return Response.json({ enabled: true, publicKey });
  } catch (err) {
    return handleApiError(err);
  }
}
