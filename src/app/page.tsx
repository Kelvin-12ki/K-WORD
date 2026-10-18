import Link from "next/link";
import {
  BrainCircuit,
  Sparkles,
  MessagesSquare,
  Flame,
  ArrowRight,
  BookOpenCheck,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_TAGLINE } from "@/lib/constants";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Word Enrichment",
    desc: "Definitions, pronunciation, synonyms, antonyms and contextual examples — generated the moment you save a word.",
  },
  {
    icon: BrainCircuit,
    title: "Spaced Repetition",
    desc: "A 1→3→7→14→30→60 day interval ladder moves words from recognition to permanent recall.",
  },
  {
    icon: PenLine,
    title: "Sentence Practice",
    desc: "Write a sentence. AI scores grammar, naturalness and context, then suggests a sharper version.",
  },
  {
    icon: MessagesSquare,
    title: "Word Playground",
    desc: "Hold realistic conversations in your target domain that naturally force active use of your saved words.",
  },
  {
    icon: Flame,
    title: "Streaks & Levels",
    desc: "Earn XP for every word, review and challenge. Level up from Word Collector to Wordsmith.",
  },
  {
    icon: BookOpenCheck,
    title: "Your Second Brain",
    desc: "Journal timeline, favorites, categories, instant search — everything you've ever learned, permanently.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute right-1/4 top-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <Badge className="mb-5 gap-1.5 px-3 py-1" variant="default">
              <Sparkles className="h-3 w-3" /> AI-powered vocabulary platform
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Turn every new word into <span className="text-gradient">active vocabulary</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              {APP_TAGLINE}. Capture words the moment you meet them, enrich them with AI, and
              master them through spaced repetition, sentence practice and real conversation.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start building vocabulary <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-28 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Your personal language second brain
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              People forget useful words within days. K WORD stores them permanently, explains
              them, and drills them until they become part of how you speak and write.
            </p>
            <Button size="lg" className="mt-7" asChild>
              <Link href="/register">
                Create your free account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        K WORD — Capture. Retain. Master.
      </footer>
    </div>
  );
}
