import { Schema, model, models, Types } from "mongoose";

const driftAssessmentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    reasons: { type: [String], default: [] },
    assessedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const DriftAssessmentModel = models.DriftAssessment || model("DriftAssessment", driftAssessmentSchema);
