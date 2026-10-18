import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="w-full max-w-md animate-fade-up">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Built for people who never want to forget a good word again.
        </p>
      </div>
    </div>
  );
}
