import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-lg shadow-primary/25">
        <BookOpenCheck className="h-5 w-5" />
      </span>
      {!collapsed && (
        <span className="text-lg">
          K <span className="text-gradient">WORD</span>
        </span>
      )}
    </Link>
  );
}
