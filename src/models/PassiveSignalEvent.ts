import { Schema, model, models, Types } from "mongoose";

const passiveSignalEventSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["QUIZ_START", "QUIZ_SUBMIT", "IDLE_SPIKE", "RAPID_GUESS", "HINT_OVERUSE", "SESSION_END"],
    },
    meta: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const PassiveSignalEventModel =
  models.PassiveSignalEvent || model("PassiveSignalEvent", passiveSignalEventSchema);
