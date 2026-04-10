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
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    /** Set from HttpOnly cookie so quizzes are not visible to other browsers / shared demo DB users. */
    quizClientScope: { type: String, index: true },
  },
  { timestamps: true },
);

const quizSchemaPaths = ["createdFromUpload", "ownerUserId", "quizClientScope"] as const;
const quizSchemaStale =
  mongoose.models.Quiz &&
  quizSchemaPaths.some((p) => !mongoose.models.Quiz!.schema.path(p));
if (quizSchemaStale) {
  delete mongoose.models.Quiz;
}

export const QuizModel = mongoose.models.Quiz ?? mongoose.model("Quiz", quizSchema);
