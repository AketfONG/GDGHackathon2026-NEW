import { Schema, model, models } from "mongoose";

const quizQuestionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIdx: { type: Number, required: true },
    explanation: { type: String, default: null },
  },
  { _id: true },
);

const quizSchema = new Schema(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    questions: { type: [quizQuestionSchema], default: [] },
    course: { type: String },
    week: { type: String },
    testType: { type: String, enum: ["cold", "hot", "review"] },
  },
  { timestamps: true },
);

export const QuizModel = models.Quiz || model("Quiz", quizSchema);
