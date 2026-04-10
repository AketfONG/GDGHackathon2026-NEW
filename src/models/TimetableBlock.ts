import { Schema, model, models, Types } from "mongoose";

const timetableBlockSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    goalTag: { type: String, required: true },
    dayOfWeek: { type: Number, required: true },
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true },
    nonSkippable: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const TimetableBlockModel = models.TimetableBlock || model("TimetableBlock", timetableBlockSchema);
