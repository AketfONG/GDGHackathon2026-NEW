import { Schema, model, models, Types } from "mongoose";

const scheduleAdherenceSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    plannedMinutes: { type: Number, required: true },
    actualMinutes: { type: Number, required: true },
    adherenceScore: { type: Number, required: true },
  },
  { timestamps: true },
);

export const ScheduleAdherenceModel =
  models.ScheduleAdherence || model("ScheduleAdherence", scheduleAdherenceSchema);
