import { Schema, model, models, Types } from "mongoose";

const questionAttemptSchema = new Schema(
  {
    questionId: { type: String, required: true },
    selectedIdx: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    responseMs: { type: Number, required: true },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    quizId: { type: Types.ObjectId, ref: "Quiz", required: true, index: true },
    score: { type: Number, required: true },
    durationSec: { type: Number, required: true },
    submittedAt: { type: Date, default: () => new Date() },
    questionAttempts: { type: [questionAttemptSchema], default: [] },
    mode: { type: String, enum: ["cold", "hot-followup"], default: "cold" },
  },
  { timestamps: true },
);

export const QuizAttemptModel = models.QuizAttempt || model("QuizAttempt", quizAttemptSchema);
