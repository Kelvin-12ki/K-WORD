import webpush from "web-push";

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let detailsSet = false;

function ensureVapid(): void {
  if (detailsSet) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@kword.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  detailsSet = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(
  target: PushTarget,
  payload: PushPayload
): Promise<void> {
  ensureVapid();
  await webpush.sendNotification(
    {
      endpoint: target.endpoint,
      keys: { p256dh: target.p256dh, auth: target.auth },
    },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 12, urgency: "normal" }
  );
}

export function isGoneError(err: unknown): boolean {
  const status = (err as { statusCode?: number } | null)?.statusCode;
  return status === 404 || status === 410;
}
