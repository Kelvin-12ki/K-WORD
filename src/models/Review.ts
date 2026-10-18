import mongoose, { Schema, type Model, type Types } from "mongoose";

export type Difficulty = "easy" | "medium" | "hard";

export interface IReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  score: number;
  difficulty: Difficulty;
  reviewDate: Date;
  nextReviewDate: Date;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 3 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    reviewDate: { type: Date, default: Date.now, index: true },
    nextReviewDate: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true } }
);

ReviewSchema.index({ userId: 1, reviewDate: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
