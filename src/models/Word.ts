import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IAiExample {
  context: string;
  sentence: string;
}

export interface IWord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  synonyms: string[];
  antonyms: string[];
  category: string;
  learnedFrom?: string;
  notes?: string;
  exampleSentences: string[];
  aiExamples: IAiExample[];
  masteryLevel: number;
  reviewCount: number;
  favorite: boolean;
  nextReviewDate?: Date | null;
  lastReviewedAt?: Date | null;
  intervalDays: number;
  totalPractices: number;
  correctPractices: number;
  createdAt: Date;
  updatedAt: Date;
}

const WordSchema = new Schema<IWord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    word: { type: String, required: true, trim: true, index: true },
    meaning: { type: String, required: true, trim: true },
    pronunciation: { type: String, trim: true },
    partOfSpeech: { type: String, trim: true },
    synonyms: { type: [String], default: [] },
    antonyms: { type: [String], default: [] },
    category: { type: String, default: "General", trim: true, index: true },
    learnedFrom: { type: String, trim: true },
    notes: { type: String, trim: true },
    exampleSentences: { type: [String], default: [] },
    aiExamples: {
      type: [{ context: String, sentence: String }],
      default: [],
    },
    masteryLevel: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    favorite: { type: Boolean, default: false, index: true },
    nextReviewDate: { type: Date, default: Date.now, index: true },
    lastReviewedAt: { type: Date, default: null },
    intervalDays: { type: Number, default: 1, min: 0 },
    totalPractices: { type: Number, default: 0, min: 0 },
    correctPractices: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

WordSchema.index({ userId: 1, word: 1 }, { unique: true });
WordSchema.index({ userId: 1, category: 1 });
WordSchema.index({ userId: 1, favorite: 1 });
WordSchema.index({ userId: 1, nextReviewDate: 1 });
WordSchema.index({ userId: 1, createdAt: -1 });

export const Word: Model<IWord> =
  mongoose.models.Word || mongoose.model<IWord>("Word", WordSchema);
