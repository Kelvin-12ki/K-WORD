import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IChallenge {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  completed: boolean;
  challengeDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true, index: true },
    completed: { type: Boolean, default: false },
    challengeDate: { type: Date, required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

ChallengeSchema.index({ userId: 1, challengeDate: 1, wordId: 1 }, { unique: true });

export const Challenge: Model<IChallenge> =
  mongoose.models.Challenge || mongoose.model<IChallenge>("Challenge", ChallengeSchema);
