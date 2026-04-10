import { Schema, model, models, Types } from "mongoose";

const obligationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    dayOfWeek: { type: Number, required: true },
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true },
    nonSkippable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ObligationModel = models.Obligation || model("Obligation", obligationSchema);
