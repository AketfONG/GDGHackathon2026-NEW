import mongoose, { Schema } from "mongoose";

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
    /** True only when created via upload-generate-cold or save-from-upload (cold). Listed on /quizzes. */
    createdFromUpload: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Next.js can keep a cached model from before new schema fields existed; then saves drop those paths.
if (mongoose.models.Quiz && !mongoose.models.Quiz.schema.path("createdFromUpload")) {
  delete mongoose.models.Quiz;
}

export const QuizModel = mongoose.models.Quiz ?? mongoose.model("Quiz", quizSchema);
