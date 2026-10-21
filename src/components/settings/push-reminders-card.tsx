"use client";

import * as React from "react";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { enablePush, disablePush, isSubscribed, pushSupported } from "@/lib/push/client";

type Status = "loading" | "on" | "off" | "unavailable" | "unsupported";

const SCHEDULE = "9:10, 11:10, 1:10, 3:10, 5:10, 8:10 PM (GMT+3)";

export function PushRemindersCard() {
  const [status, setStatus] = React.useState<Status>("loading");
  const [busy, setBusy] = React.useState(false);
  const publicKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      if (!pushSupported()) {
        setStatus("unsupported");
        return;
      }
      try {
        const res = await fetch("/api/push/key");
        const data = await res.json();
        if (!alive) return;

        if (!data.enabled || !data.publicKey) {
          setStatus("unavailable");
          return;
        }
        publicKeyRef.current = data.publicKey as string;
        setStatus((await isSubscribed()) ? "on" : "off");
      } catch {
        if (alive) setStatus("off");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (status === "on") {
        await disablePush();
        setStatus("off");
        toast.success("Reminders turned off");
        return;
      }

      const publicKey = publicKeyRef.current;
      if (!publicKey) {
        toast.error("Reminders are not available on this deployment");
        return;
      }

      const result = await enablePush(publicKey);
      if (result === "ok") {
        setStatus("on");
        toast.success("Reminders on — 6 nudges a day");
      } else if (result === "denied") {
        toast.error("Permission denied. Allow notifications in your browser settings.");
      } else {
        toast.error("Could not enable reminders. Try reloading the page.");
      }
    } finally {
      setBusy(false);
    }
  }

  const active = status === "on";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-sky-500" /> Practice Reminders
        </CardTitle>
        <CardDescription>
          Push notifications that nudge you to review or add words — sent at {SCHEDULE}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={active ? "default" : "secondary"}>
            {status === "loading"
              ? "Checking…"
              : status === "on"
                ? "On"
                : status === "unsupported"
                  ? "Not supported"
                  : status === "unavailable"
                    ? "Unavailable"
                    : "Off"}
          </Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">What you&apos;ll get</span>
          <span className="text-right text-xs text-muted-foreground">
            Words due for review · streak nudges · practice prompts
          </span>
        </div>
        <Button
          onClick={toggle}
          disabled={busy || status === "loading" || status === "unsupported" || status === "unavailable"}
          variant={active ? "outline" : "default"}
          className="w-full"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : active ? (
            "Turn reminders off"
          ) : (
            "Turn reminders on"
          )}
        </Button>
        {status === "unsupported" && (
          <p className="text-xs text-muted-foreground">
            This browser does not support web push. Try Chrome, Edge, Firefox or Safari 16+.
          </p>
        )}
        {status === "unavailable" && (
          <p className="text-xs text-muted-foreground">
            VAPID keys are not configured on this deployment yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
