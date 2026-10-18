import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IPracticeAttempt {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  sentence: string;
  score: number;
  grammarScore: number;
  naturalnessScore: number;
  contextScore: number;
  feedback: string;
  suggestion?: string;
  createdAt: Date;
}

const PracticeAttemptSchema = new Schema<IPracticeAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true, index: true },
    sentence: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 10 },
    grammarScore: { type: Number, required: true, min: 0, max: 10 },
    naturalnessScore: { type: Number, required: true, min: 0, max: 10 },
    contextScore: { type: Number, required: true, min: 0, max: 10 },
    feedback: { type: String, required: true },
    suggestion: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true } }
);

PracticeAttemptSchema.index({ userId: 1, createdAt: -1 });

export const PracticeAttempt: Model<IPracticeAttempt> =
  mongoose.models.PracticeAttempt ||
  mongoose.model<IPracticeAttempt>("PracticeAttempt", PracticeAttemptSchema);
