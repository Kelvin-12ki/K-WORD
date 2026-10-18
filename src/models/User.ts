import mongoose, { Schema, type Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  passwordHash?: string;
  extensionApiKey?: string;
  provider: "credentials" | "google" | "microsoft";
  streak: number;
  lastActiveDate?: Date | null;
  totalWords: number;
  masteredWords: number;
  favoriteCount: number;
  xp: number;
  level: number;
  customCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    image: { type: String },
    passwordHash: { type: String, select: false },
    extensionApiKey: { type: String, select: false, index: true, unique: true, sparse: true },
    provider: {
      type: String,
      enum: ["credentials", "google", "microsoft"],
      default: "credentials",
    },
    streak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },
    totalWords: { type: Number, default: 0, min: 0 },
    masteredWords: { type: Number, default: 0, min: 0 },
    favoriteCount: { type: Number, default: 0, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    customCategories: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
