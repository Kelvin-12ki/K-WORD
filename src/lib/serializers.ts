import type { IWord, IReview, IChallenge, IPracticeAttempt, IUserExample } from "@/models";
import type { WordDTO, ReviewDTO, ChallengeDTO, PracticeAttemptDTO, UserExampleDTO } from "@/types";

export function serializeWord(w: IWord): WordDTO {
  return {
    id: w._id.toString(),
    userId: w.userId.toString(),
    word: w.word,
    meaning: w.meaning,
    pronunciation: w.pronunciation,
    partOfSpeech: w.partOfSpeech,
    synonyms: w.synonyms ?? [],
    antonyms: w.antonyms ?? [],
    category: w.category,
    learnedFrom: w.learnedFrom,
    notes: w.notes,
    exampleSentences: w.exampleSentences ?? [],
    aiExamples: w.aiExamples ?? [],
    masteryLevel: w.masteryLevel ?? 0,
    reviewCount: w.reviewCount ?? 0,
    favorite: Boolean(w.favorite),
    nextReviewDate: w.nextReviewDate ? new Date(w.nextReviewDate).toISOString() : null,
    lastReviewedAt: w.lastReviewedAt ? new Date(w.lastReviewedAt).toISOString() : null,
    totalPractices: w.totalPractices ?? 0,
    correctPractices: w.correctPractices ?? 0,
    createdAt: new Date(w.createdAt).toISOString(),
    updatedAt: new Date(w.updatedAt).toISOString(),
  };
}

export function serializeReview(r: IReview, word?: string): ReviewDTO {
  return {
    id: r._id.toString(),
    wordId: r.wordId.toString(),
    word,
    score: r.score,
    difficulty: r.difficulty,
    reviewDate: new Date(r.reviewDate).toISOString(),
    nextReviewDate: new Date(r.nextReviewDate).toISOString(),
  };
}

export function serializeChallenge(c: IChallenge, word?: string): ChallengeDTO {
  return {
    id: c._id.toString(),
    wordId: c.wordId.toString(),
    word,
    completed: Boolean(c.completed),
    challengeDate: new Date(c.challengeDate).toISOString(),
  };
}

export function serializePractice(p: IPracticeAttempt): PracticeAttemptDTO {
  return {
    id: p._id.toString(),
    wordId: p.wordId.toString(),
    sentence: p.sentence,
    score: p.score,
    grammarScore: p.grammarScore,
    naturalnessScore: p.naturalnessScore,
    contextScore: p.contextScore,
    feedback: p.feedback,
    suggestion: p.suggestion,
    createdAt: new Date(p.createdAt).toISOString(),
  };
}

export function serializeExample(e: IUserExample, word?: string): UserExampleDTO {
  return {
    id: e._id.toString(),
    wordId: e.wordId.toString(),
    word,
    text: e.text,
    createdAt: new Date(e.createdAt).toISOString(),
  };
}
