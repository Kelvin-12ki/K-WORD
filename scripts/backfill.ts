/**
 * Backfill script — re-runs AI enrichment for words that are missing
 * synonyms/antonyms/part-of-speech, or that still carry the old
 * fabricated placeholder synonyms.
 *
 * Usage:
 *   MONGODB_URI="..." AI_API_KEY="..." npm run backfill
 *
 * Optional: AI_BASE_URL, AI_MODEL, AI_REASONING_EFFORT
 */
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Word } from "../src/models";
import { enrichWord } from "../src/lib/ai/service";
import { aiAvailable } from "../src/lib/ai/client";
import { ensureSrvResolution } from "./dns-fallback";

const PLACEHOLDER_SYNONYMS = ["notable", "significant", "relevant"];
const LEGACY_MEANING = /— (a|an) term worth adding to your active vocabulary\.$/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("✗ MONGODB_URI is not set.");
    process.exit(1);
  }
  if (!aiAvailable()) {
    console.error("✗ AI_API_KEY is not set — nothing to enrich with.");
    process.exit(1);
  }

  await ensureSrvResolution(process.env.MONGODB_URI);
  await connectDB();

  const filter = {
    $or: [
      { synonyms: { $size: 0 } },
      { synonyms: { $all: PLACEHOLDER_SYNONYMS } },
      { meaning: { $regex: "term worth adding to your active vocabulary" } },
    ],
  };

  const total = await Word.countDocuments(filter);
  console.log(`Found ${total} word(s) needing enrichment.`);
  if (total === 0) {
    await mongoose.disconnect();
    return;
  }

  const words = await Word.find(filter).lean();
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const w of words) {
    const before = w.synonyms.join(", ");
    const r = await enrichWord({
      word: w.word,
      meaning: w.meaning,
      category: w.category,
    });

    if (r.source !== "ai") {
      failed++;
      console.log(`  ! ${w.word} — AI unavailable, skipped`);
      await sleep(1500);
      continue;
    }

    const patch: Record<string, unknown> = {};
    if (r.pronunciation) patch.pronunciation = r.pronunciation;
    if (r.partOfSpeech) patch.partOfSpeech = r.partOfSpeech;
    if (r.synonyms.length) patch.synonyms = r.synonyms.slice(0, 8);
    if (r.antonyms.length) patch.antonyms = r.antonyms.slice(0, 6);
    if (r.examples.length) patch.aiExamples = r.examples.slice(0, 6);
    if (LEGACY_MEANING.test(w.meaning) && r.refinedMeaning) patch.meaning = r.refinedMeaning;

    if (Object.keys(patch).length === 0) {
      unchanged++;
      console.log(`  - ${w.word} — AI returned nothing new`);
      await sleep(800);
      continue;
    }

    await Word.updateOne({ _id: w._id }, { $set: patch });
    updated++;
    console.log(`  ✓ ${w.word} — [${before || "no synonyms"}] → ${r.synonyms.join(", ")}`);
    await sleep(800);
  }

  console.log(`\nDone. ${updated} updated, ${unchanged} unchanged, ${failed} failed.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
