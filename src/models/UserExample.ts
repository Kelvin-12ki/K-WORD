import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IUserExample {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  text: string;
  createdAt: Date;
}

const UserExampleSchema = new Schema<IUserExample>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true } }
);

UserExampleSchema.index({ userId: 1, createdAt: -1 });

export const UserExample: Model<IUserExample> =
  mongoose.models.UserExample ||
  mongoose.model<IUserExample>("UserExample", UserExampleSchema);
