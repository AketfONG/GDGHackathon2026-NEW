import { Schema, model, models, Types } from "mongoose";

const interventionActionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["RECAP_2MIN", "CONFIDENCE_RESET", "SWITCH_DIFFICULTY", "SCHEDULE_REPLAN", "MENTOR_PING"],
    },
    triggerReasons: { type: [String], default: [] },
    message: { type: String, required: true },
    status: { type: String, required: true },
    cooldownUntil: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const InterventionActionModel =
  models.InterventionAction || model("InterventionAction", interventionActionSchema);
