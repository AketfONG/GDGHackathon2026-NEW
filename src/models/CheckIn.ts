import { Schema, model, models, Types } from "mongoose";

const checkInSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    focusLevel: { type: Number, required: true },
    mood: { type: Number, required: true },
    confidence: { type: Number, required: true },
    note: { type: String, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const CheckInModel = models.CheckIn || model("CheckIn", checkInSchema);
