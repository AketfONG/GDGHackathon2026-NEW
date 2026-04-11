import mongoose, { Schema } from "mongoose";

const quizQuestionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIdx: { type: Number, required: true },
    explanation: { type: String, default: null },
    /** Topic/concept this question covers — used for tailored review question generation */
    topic: { type: String, default: null },
  },
  { _id: true },
);

/** Only written after a cold quiz is submitted — omit entirely on new quizzes. */
const pendingHotFollowUpSchema = new Schema(
  {
    dueDate: { type: String },
    sourceAttemptId: { type: Schema.Types.ObjectId, ref: "QuizAttempt" },
  },
  { _id: false },
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
    /**
     * After a cold (upload) attempt is completed, schedule a hot retake on `dueDate` (YYYY-MM-DD).
     * Cleared when the user submits a later attempt (hot completion). Not set on quiz creation.
     */
    pendingHotFollowUp: {
      type: pendingHotFollowUpSchema,
      required: false,
    },
  },
  { timestamps: true },
);

const quizSchemaPaths = [
  "createdFromUpload",
  "ownerUserId",
  "quizClientScope",
  "pendingHotFollowUp",
] as const;
const quizSchemaStale =
  mongoose.models.Quiz &&
  quizSchemaPaths.some((p) => !mongoose.models.Quiz!.schema.path(p));
if (quizSchemaStale) {
  delete mongoose.models.Quiz;
}

export const QuizModel = mongoose.models.Quiz ?? mongoose.model("Quiz", quizSchema);
