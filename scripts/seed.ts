/**
 * Seed script — creates a demo user with realistic vocabulary data.
 *
 * Usage:
 *   npm run seed
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { User, Word, Review, UserExample } from "../src/models";
import { scheduleReview } from "../src/lib/spaced-repetition";
import { startOfDay, addDays } from "../src/lib/utils";

const SEED_EMAIL = "demo@kword.app";

const WORDS: {
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  category: string;
  learnedFrom: string;
  notes?: string;
  synonyms: string[];
  antonyms: string[];
  examples: { context: string; sentence: string }[];
  masteryLevel: number;
  reviewCount: number;
  favorite?: boolean;
  ageDays: number;
}[] = [
  {
    word: "Correspondence",
    meaning: "Communication through written messages, especially between two parties.",
    pronunciation: "/ˌkɒrɪˈspɒndəns/",
    partOfSpeech: "noun",
    category: "Professional Communication",
    learnedFrom: "Supervisor feedback",
    notes: "Often used in formal business contexts — 'maintain correspondence'.",
    synonyms: ["communication", "letters", "exchange", "traffic"],
    antonyms: ["silence", "separation"],
    examples: [
      { context: "Professional", sentence: "The team maintained regular correspondence with the client." },
      { context: "Business", sentence: "All correspondence with vendors is handled by procurement." },
      { context: "Academic", sentence: "The scholars exchanged correspondence about the research findings." },
      { context: "Daily", sentence: "I kept up correspondence with my college friends." },
    ],
    masteryLevel: 3,
    reviewCount: 4,
    favorite: true,
    ageDays: 21,
  },
  {
    word: "Pragmatic",
    meaning: "Dealing with problems in a practical way rather than relying on theory.",
    pronunciation: "/præɡˈmætɪk/",
    partOfSpeech: "adjective",
    category: "Business",
    learnedFrom: "Leadership podcast",
    notes: "Pairs well with 'approach', 'decision', 'methodology'.",
    synonyms: ["practical", "realistic", "sensible", "down-to-earth"],
    antonyms: ["idealistic", "impractical", "theoretical"],
    examples: [
      { context: "Professional", sentence: "A pragmatic approach was adopted during system development." },
      { context: "Business", sentence: "The manager made a pragmatic decision about the budget." },
      { context: "Academic", sentence: "The researcher used a pragmatic methodology." },
      { context: "Daily", sentence: "Let's be pragmatic about this situation." },
    ],
    masteryLevel: 4,
    reviewCount: 6,
    favorite: true,
    ageDays: 18,
  },
  {
    word: "Robust",
    meaning: "Strong and effective; able to withstand adverse conditions.",
    pronunciation: "/rəʊˈbʌst/",
    partOfSpeech: "adjective",
    category: "Technology",
    learnedFrom: "Architecture review",
    notes: "Common in engineering and security contexts.",
    synonyms: ["strong", "sturdy", "reliable", "solid"],
    antonyms: ["fragile", "weak", "flimsy"],
    examples: [
      { context: "Professional", sentence: "The platform has a robust authentication system." },
      { context: "Business", sentence: "They built a robust supply chain across three continents." },
      { context: "Academic", sentence: "The study requires a robust statistical framework." },
      { context: "Daily", sentence: "This backpack is robust enough for any hike." },
    ],
    masteryLevel: 5,
    reviewCount: 8,
    favorite: true,
    ageDays: 15,
  },
  {
    word: "Facilitate",
    meaning: "To make an process easier or possible.",
    pronunciation: "/fəˈsɪlɪteɪt/",
    partOfSpeech: "verb",
    category: "Leadership",
    learnedFrom: "Team retro",
    synonyms: ["enable", "assist", "expedite", "support"],
    antonyms: ["hinder", "obstruct", "impede"],
    examples: [
      { context: "Professional", sentence: "The workshop was designed to facilitate cross-team collaboration." },
      { context: "Business", sentence: "The new portal facilitates faster onboarding." },
      { context: "Academic", sentence: "Mentors facilitate learning among first-year students." },
      { context: "Daily", sentence: "A shared calendar facilitates planning family events." },
    ],
    masteryLevel: 3,
    reviewCount: 3,
    ageDays: 10,
  },
  {
    word: "Delineate",
    meaning: "To describe or portray something precisely; to mark the outline of.",
    pronunciation: "/dɪˈlɪnieɪt/",
    partOfSpeech: "verb",
    category: "Academic",
    learnedFrom: "Research paper",
    synonyms: ["outline", "describe", "define", "specify"],
    antonyms: ["obscure", "confuse"],
    examples: [
      { context: "Academic", sentence: "The paper delineates three phases of the learning process." },
      { context: "Professional", sentence: "The contract delineates each party's responsibilities." },
      { context: "Business", sentence: "Let's delineate the scope before estimating costs." },
      { context: "Daily", sentence: "The map delineates the boundaries of the park." },
    ],
    masteryLevel: 2,
    reviewCount: 2,
    ageDays: 6,
  },
  {
    word: "Nuanced",
    meaning: "Showing subtle differences or distinctions; complex and delicate.",
    pronunciation: "/ˈnjuːɑːnst/",
    partOfSpeech: "adjective",
    category: "Communication",
    learnedFrom: "Feedback on presentation",
    synonyms: ["subtle", "fine", "complex", "delicate"],
    antonyms: ["oversimplified", "crude", "blunt"],
    examples: [
      { context: "Professional", sentence: "She offered a nuanced critique of the proposal." },
      { context: "Business", sentence: "The negotiation required a nuanced understanding of both markets." },
      { context: "Academic", sentence: "The author presents a nuanced view of globalization." },
      { context: "Daily", sentence: "It's a more nuanced issue than the headlines suggest." },
    ],
    masteryLevel: 2,
    reviewCount: 1,
    ageDays: 4,
  },
  {
    word: "Corroborate",
    meaning: "To confirm or give support to a statement or theory with evidence.",
    pronunciation: "/kəˈrɒbəreɪt/",
    partOfSpeech: "verb",
    category: "Legal",
    learnedFrom: "Compliance training",
    synonyms: ["confirm", "verify", "substantiate", "validate"],
    antonyms: ["contradict", "refute", "dispute"],
    examples: [
      { context: "Professional", sentence: "The logs corroborate the engineer's account of the incident." },
      { context: "Business", sentence: "Sales data corroborates the forecast for Q3." },
      { context: "Academic", sentence: "Two independent studies corroborate these findings." },
      { context: "Daily", sentence: "Her story was corroborated by three witnesses." },
    ],
    masteryLevel: 1,
    reviewCount: 1,
    ageDays: 2,
  },
  {
    word: "Granular",
    meaning: "Extremely detailed or precise; consisting of fine grains or particles.",
    pronunciation: "/ˈɡrænjələ/",
    partOfSpeech: "adjective",
    category: "Technology",
    learnedFrom: "Analytics dashboard review",
    notes: "'Granular control', 'granular data' are the most common collocations.",
    synonyms: ["detailed", "fine-grained", "precise", "specific"],
    antonyms: ["broad", "coarse", "general"],
    examples: [
      { context: "Professional", sentence: "The dashboard provides granular visibility into user behavior." },
      { context: "Business", sentence: "We need granular forecasts per region, not one global number." },
      { context: "Academic", sentence: "The dataset allows granular analysis of household spending." },
      { context: "Daily", sentence: "The recipe needs a more granular breakdown of ingredients." },
    ],
    masteryLevel: 0,
    reviewCount: 0,
    ageDays: 0,
  },
  {
    word: "Leverage",
    meaning: "To use something to maximum advantage.",
    pronunciation: "/ˈliːvərɪdʒ/",
    partOfSpeech: "verb",
    category: "Entrepreneurship",
    learnedFrom: "Startup pitch",
    synonyms: ["utilize", "exploit", "capitalize on", "harness"],
    antonyms: ["waste", "squander"],
    examples: [
      { context: "Business", sentence: "The startup leveraged its early adopters for organic growth." },
      { context: "Professional", sentence: "We can leverage the existing API for the new feature." },
      { context: "Academic", sentence: "The model leverages publicly available datasets." },
      { context: "Daily", sentence: "She leveraged her network to find a new role." },
    ],
    masteryLevel: 4,
    reviewCount: 5,
    favorite: true,
    ageDays: 12,
  },
  {
    word: "Mitigate",
    meaning: "To make less severe, serious or painful.",
    pronunciation: "/ˈmɪtɪɡeɪt/",
    partOfSpeech: "verb",
    category: "Cybersecurity",
    learnedFrom: "Security incident review",
    synonyms: ["reduce", "alleviate", "lessen", "temper"],
    antonyms: ["aggravate", "intensify", "worsen"],
    examples: [
      { context: "Professional", sentence: "The team implemented controls to mitigate phishing risk." },
      { context: "Business", sentence: "Hedging strategies mitigate currency exposure." },
      { context: "Academic", sentence: "Urban planning can mitigate the effects of heat islands." },
      { context: "Daily", sentence: "Parking under shade mitigates the afternoon heat." },
    ],
    masteryLevel: 3,
    reviewCount: 3,
    ageDays: 8,
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("✗ MONGODB_URI is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }

  console.log("→ Connecting to MongoDB…");
  await connectDB();

  const email = SEED_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`✓ Demo user already exists: ${email} — reseeding words…`);
    await Word.deleteMany({ userId: existing._id });
    await Review.deleteMany({ userId: existing._id });
    await UserExample.deleteMany({ userId: existing._id });
  }

  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || "Password123!", 12);
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: "Demo Learner",
        passwordHash,
        provider: "credentials",
        streak: 6,
        lastActiveDate: startOfDay(),
        xp: 840,
        level: 3,
      },
      $setOnInsert: { email },
    },
    { upsert: true, new: true }
  );

  const created = [];
  for (const w of WORDS) {
    const createdAt = addDays(new Date(), -w.ageDays);
    const schedule = scheduleReview(w.masteryLevel, "medium", Math.max(0, w.reviewCount - 1));
    const nextReview =
      w.masteryLevel >= 4 ? addDays(new Date(), 14 - Math.min(12, w.ageDays % 14)) : startOfDay();

    created.push({
      userId: user._id,
      word: w.word,
      meaning: w.meaning,
      pronunciation: w.pronunciation,
      partOfSpeech: w.partOfSpeech,
      synonyms: w.synonyms,
      antonyms: w.antonyms,
      category: w.category,
      learnedFrom: w.learnedFrom,
      notes: w.notes,
      exampleSentences: [],
      aiExamples: w.examples,
      masteryLevel: w.masteryLevel,
      reviewCount: w.reviewCount,
      favorite: Boolean(w.favorite),
      nextReviewDate: nextReview,
      lastReviewedAt: w.reviewCount > 0 ? addDays(new Date(), -Math.max(1, 36 - w.ageDays)) : null,
      intervalDays: schedule.intervalDays,
      totalPractices: Math.min(3, w.reviewCount),
      correctPractices: Math.min(2, w.reviewCount),
      createdAt,
      updatedAt: createdAt,
    });
  }

  const docs = await Word.insertMany(created);

  // Personal examples for a few words
  const robust = docs.find((d) => d.word === "Robust");
  const pragmatic = docs.find((d) => d.word === "Pragmatic");
  if (robust) {
    await UserExample.create({
      userId: user._id,
      wordId: robust._id,
      text: "The platform has a robust authentication system.",
    });
  }
  if (pragmatic) {
    await UserExample.create({
      userId: user._id,
      wordId: pragmatic._id,
      text: "We took a pragmatic path and shipped the MVP first.",
    });
  }

  // A few review records for the activity chart
  const reviewable = docs.filter((d) => d.reviewCount > 0).slice(0, 6);
  const reviews = [];
  for (const d of reviewable) {
    for (let i = 0; i < Math.min(4, d.reviewCount); i++) {
      const difficulty = i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard";
      const reviewDate = addDays(new Date(), -(i * 3 + 1));
      reviews.push({
        userId: user._id,
        wordId: d._id,
        score: difficulty === "easy" ? 3 : difficulty === "medium" ? 2 : 1,
        difficulty,
        reviewDate,
        nextReviewDate: addDays(reviewDate, 3),
      });
    }
  }
  if (reviews.length) await Review.insertMany(reviews);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        totalWords: docs.length,
        masteredWords: docs.filter((d) => d.masteryLevel >= 5).length,
        favoriteCount: docs.filter((d) => d.favorite).length,
        customCategories: ["Product Management"],
      },
    }
  );

  console.log(`\n✓ Seeded ${docs.length} words, ${reviews.length} reviews for ${email}`);
  console.log(`  Password: ${process.env.SEED_PASSWORD || "Password123!"}`);
  console.log("  Log in at http://localhost:3000/login\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
