import Link from "next/link";
import mongoose from "mongoose";
import {
  Library,
  Award,
  Star,
  Flame,
  BrainCircuit,
  PlusCircle,
  Trophy,
  ArrowRight,
  MessagesSquare,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Word, Review, Challenge, User } from "@/models";
import { getStats } from "@/lib/stats";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import {
  GrowthChart,
  ActivityChart,
  MasteryChart,
  CategoryChart,
} from "@/components/dashboard/charts";
import { TodayWordCard } from "@/components/dashboard/today-word";
import { levelForXP, levelProgress, nextLevelXP } from "@/lib/gamification";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const id = session?.user?.id;

  await connectDB();
  const user = await User.findOne({
    $or: [...(id ? [{ _id: id }] : []), ...(email ? [{ email }] : [])],
  }).lean();
  if (!user) return null;

  const userId = user._id.toString();
  const rangeDays = 30;

  const [stats, growthRaw, weeklyRaw, masteryRaw, categoryRaw, recentReviews, challenge] =
    await Promise.all([
      getStats(userId),
      Word.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: new Date(Date.now() - rangeDays * 86400000) },
          },
        },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Review.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            reviewDate: { $gte: new Date(Date.now() - 14 * 86400000) },
          },
        },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewDate" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Word.aggregate<{ _id: number; count: number }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$masteryLevel", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Word.aggregate<{ _id: string; count: number }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Review.find({ userId })
        .sort({ reviewDate: -1 })
        .limit(6)
        .populate("wordId", "word")
        .lean(),
      Challenge.findOne({
        userId,
        challengeDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }).lean(),
    ]);

  const challengeCount = await Challenge.countDocuments({ userId, completed: true });

  const growthMap = new Map(growthRaw.map((g) => [g._id, g.count]));
  let running = await Word.countDocuments({
    userId,
    createdAt: { $lt: new Date(Date.now() - rangeDays * 86400000) },
  });
  const growth: { date: string; total: number }[] = [];
  for (let i = rangeDays; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    running += growthMap.get(key) ?? 0;
    if (i % 2 === 0 || i === 0) growth.push({ date: key.slice(5), total: running });
  }

  const wmap = new Map(weeklyRaw.map((w) => [w._id, w.count]));
  const weekly = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
      reviews: wmap.get(d.toISOString().slice(0, 10)) ?? 0,
    };
  });

  const level = levelForXP(stats.xp);
  const progress = levelProgress(stats.xp);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name?.split(" ")[0] ?? "learner"}`}
        description="Here's your vocabulary growth at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/review">
                <BrainCircuit className="h-4 w-4" />
                Review {stats.dueToday > 0 ? `(${stats.dueToday})` : ""}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/words/new">
                <PlusCircle className="h-4 w-4" /> Add word
              </Link>
            </Button>
          </>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Library} label="Total Words" value={stats.totalWords} tone="primary" />
        <StatCard icon={Award} label="Mastered" value={stats.masteredWords} tone="accent" />
        <StatCard icon={Star} label="Favorites" value={stats.favorites} tone="warning" />
        <StatCard icon={Flame} label="Streak" value={`${stats.streak}d`} tone="violet" />
        <StatCard
          icon={BrainCircuit}
          label="Due Today"
          value={stats.dueToday}
          tone="sky"
          sub={stats.dueToday > 0 ? "Ready for review" : "All caught up"}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/25">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current level</p>
              <p className="text-lg font-bold">{level.title}</p>
            </div>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{stats.xp} XP</span>
              <span>{nextLevelXP(stats.xp)} XP</span>
            </div>
            <Progress value={progress} className="h-2" indicatorClassName="gradient-primary" />
          </div>
          <Badge variant="accent" className="gap-1">
            <Trophy className="h-3 w-3" /> {challengeCount} challenges
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vocabulary growth</CardTitle>
            <CardDescription>Words added over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthChart data={growth} />
          </CardContent>
        </Card>
        <TodayWordCard challengeCompleted={Boolean(challenge?.completed)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly learning activity</CardTitle>
            <CardDescription>Reviews completed over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart data={weekly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mastery progress</CardTitle>
            <CardDescription>How your vocabulary is distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <MasteryChart data={masteryRaw.map((m) => ({ level: m._id, count: m.count }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category distribution</CardTitle>
            <CardDescription>Where your words come from</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryRaw.length ? (
              <CategoryChart data={categoryRaw.map((c) => ({ name: c._id, count: c.count }))} />
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No categories yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent reviews</CardTitle>
              <CardDescription>Your latest recall sessions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/review">
                Review now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No reviews yet. Start your first session!
              </p>
            ) : (
              <ul className="space-y-2.5">
                {recentReviews.map((r, i) => {
                  const w = r.wordId as unknown as { word?: string };
                  return (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="font-medium">{w?.word ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(r.reviewDate)}</p>
                      </div>
                      <Badge
                        variant={
                          r.difficulty === "easy"
                            ? "accent"
                            : r.difficulty === "medium"
                              ? "default"
                              : "destructive"
                        }
                        className="capitalize"
                      >
                        {r.difficulty}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.totalWords === 0 && (
        <EmptyState
          icon={MessagesSquare}
          title="Your vocabulary bank is empty"
          description="Add your first word and K WORD will enrich it with AI — definition, pronunciation, synonyms and examples."
          action={
            <Button asChild>
              <Link href="/words/new">
                <PlusCircle className="h-4 w-4" /> Add your first word
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
