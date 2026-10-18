import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Word, UserExample, PracticeAttempt } from "@/models";
import { requireUser } from "@/lib/session";
import { serializeWord, serializeExample, serializePractice } from "@/lib/serializers";
import { WordDetailClient } from "./word-detail-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Word" };

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await requireUser();
    await connectDB();
    const [word, examples, attempts] = await Promise.all([
      Word.findOne({ _id: id, userId }).lean(),
      UserExample.find({ wordId: id, userId }).sort({ createdAt: -1 }).lean(),
      PracticeAttempt.find({ wordId: id, userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    if (!word) notFound();
    return (
      <WordDetailClient
        word={serializeWord(word as never)}
        examples={examples.map((e) => serializeExample(e as never, (word as { word: string }).word))}
        attempts={attempts.map((a) => serializePractice(a as never))}
      />
    );
  } catch {
    notFound();
  }
}
