import { requireUser, handleApiError } from "@/lib/session";
import { enrichSchema } from "@/lib/validators";
import { enrichWord } from "@/lib/ai/service";

export const dynamic = "force-dynamic";

/** POST /api/ai/enrich — preview AI enrichment without saving */
export async function POST(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const parsed = enrichSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await enrichWord(parsed.data);
    return Response.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
