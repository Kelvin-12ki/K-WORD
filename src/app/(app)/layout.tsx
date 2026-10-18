import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { levelForXP, levelProgress } from "@/lib/gamification";
import { Sidebar, MobileNav, type ShellUser } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email && !session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findOne({
    $or: [
      ...(session.user.id ? [{ _id: session.user.id }] : []),
      ...(session.user.email ? [{ email: session.user.email.toLowerCase() }] : []),
    ],
  }).lean();

  if (!user) redirect("/login");

  const { level, title } = levelForXP(user.xp ?? 0);
  const shellUser: ShellUser = {
    name: user.name ?? session.user.name,
    email: user.email ?? session.user.email,
    image: user.image ?? session.user.image,
    streak: user.streak ?? 0,
    xp: user.xp ?? 0,
    level,
    levelTitle: title,
    progress: levelProgress(user.xp ?? 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={shellUser} />
      <MobileNav user={shellUser} />
      <main className="pb-20 lg:pb-8 lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
