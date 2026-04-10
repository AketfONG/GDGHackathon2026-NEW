import { NextRequest, NextResponse } from "next/server";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { DriftAssessmentModel } from "@/models/DriftAssessment";
import { InterventionActionModel } from "@/models/InterventionAction";
import { ScheduleAdherenceModel } from "@/models/ScheduleAdherence";
import { TimetableBlockModel } from "@/models/TimetableBlock";
import { ObligationModel } from "@/models/Obligation";

export async function GET(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const user = auth.user;

  const [attempts, latestAssessment, interventions, adherence, scheduleBlocks, obligations] =
    await Promise.all([
      QuizAttemptModel.find({ userId: user._id }).sort({ submittedAt: -1 }).limit(10).lean(),
      DriftAssessmentModel.findOne({ userId: user._id }).sort({ assessedAt: -1 }).lean(),
      InterventionActionModel.find({ userId: user._id }).sort({ createdAt: -1 }).limit(8).lean(),
      ScheduleAdherenceModel.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean(),
      TimetableBlockModel.find({ userId: user._id }).lean(),
      ObligationModel.find({ userId: user._id }).lean(),
    ]);

  return NextResponse.json({
    user,
    metrics: {
      attemptCount: attempts.length,
      avgScore:
        attempts.length === 0
          ? 0
          : Number((attempts.reduce((a: number, b: any) => a + b.score, 0) / attempts.length).toFixed(2)),
      latestRisk: latestAssessment,
      latestAdherence: adherence?.adherenceScore ?? 1,
      scheduleBlockCount: scheduleBlocks.length,
      obligationCount: obligations.length,
    },
    attempts,
    interventions,
  });
}
