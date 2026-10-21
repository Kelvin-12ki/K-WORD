import { connectDB } from "@/lib/db";
import { PushSubscription, Word } from "@/models";
import { sendPush, isGoneError, pushConfigured } from "@/lib/push/server";
import type { IPushSubscription } from "@/models";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_GAP_MS = 90 * 60 * 1000;
const MAX_SENDS_PER_RUN = 500;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

interface ReminderPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

function buildPayload(due: number, total: number): ReminderPayload | null {
  if (due > 0) {
    return {
      title: `${due} word${due === 1 ? "" : "s"} due for review`,
      body: "A 5-minute session keeps them sticking.",
      url: "/review",
      tag: "kword-review",
    };
  }
  if (total > 0) {
    return {
      title: "Keep your streak alive",
      body: "Nothing due right now — try a quick practice round.",
      url: "/practice",
      tag: "kword-practice",
    };
  }
  return null;
}

export async function GET(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return Response.json({ error: "Push is not configured" }, { status: 503 });
  }

  await connectDB();

  const subs = (await PushSubscription.find({}).lean()) as unknown as Array<
    Pick<IPushSubscription, "_id" | "userId" | "endpoint" | "p256dh" | "auth" | "lastSentAt">
  >;

  const now = Date.now();
  const today = startOfTodayUTC();

  let sent = 0;
  let skipped = 0;
  let removed = 0;
  let failed = 0;

  for (const sub of subs) {
    if (sent >= MAX_SENDS_PER_RUN) {
      failed += 1;
      continue;
    }

    if (sub.lastSentAt && now - new Date(sub.lastSentAt).getTime() < MIN_GAP_MS) {
      skipped += 1;
      continue;
    }

    const [due, total] = await Promise.all([
      Word.countDocuments({ userId: sub.userId, nextReviewDate: { $lte: today } }),
      Word.countDocuments({ userId: sub.userId }),
    ]);

    const payload = buildPayload(due, total);
    if (!payload) {
      skipped += 1;
      continue;
    }

    try {
      await sendPush(sub, payload);
      await PushSubscription.updateOne(
        { _id: sub._id },
        { $set: { lastSentAt: new Date() } }
      );
      sent += 1;
    } catch (err) {
      if (isGoneError(err)) {
        await PushSubscription.deleteOne({ _id: sub._id });
        removed += 1;
      } else {
        failed += 1;
      }
    }
  }

  return Response.json({
    subscriptions: subs.length,
    sent,
    skipped,
    removed,
    failed,
  });
}
