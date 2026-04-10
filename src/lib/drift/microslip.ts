import { scoreDrift } from "@/lib/drift/score";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { PassiveSignalEventModel } from "@/models/PassiveSignalEvent";
import { CheckInModel } from "@/models/CheckIn";
import { ScheduleAdherenceModel } from "@/models/ScheduleAdherence";
import { DriftAssessmentModel } from "@/models/DriftAssessment";
import { Types } from "mongoose";

export async function evaluateMicroSlip(userId: string) {
  await connectToDatabase();
  const userObjectId = new Types.ObjectId(userId);

  const [attempts, passiveEvents, latestCheckIn, adherence] = await Promise.all([
    QuizAttemptModel.find({ userId: userObjectId }).sort({ submittedAt: -1 }).limit(8).lean(),
    PassiveSignalEventModel.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(40).lean(),
    CheckInModel.findOne({ userId: userObjectId }).sort({ createdAt: -1 }).lean(),
    ScheduleAdherenceModel.findOne({ userId: userObjectId }).sort({ createdAt: -1 }).lean(),
  ]);

  const accuracyAvg =
    attempts.length === 0
      ? 1
      : attempts.reduce((acc, item) => acc + item.score, 0) / attempts.length;

  const responseTimes = attempts
    .flatMap((item) => item.questionAttempts)
    .map((q) => q.responseMs)
    .sort((a, b) => a - b);

  const medianResponseMs =
    responseTimes.length === 0
      ? 0
      : responseTimes[Math.floor(responseTimes.length / 2)];

  const rapidGuessCount = passiveEvents.filter((e) => e.type === "RAPID_GUESS").length;
  const idleSpikeCount = passiveEvents.filter((e) => e.type === "IDLE_SPIKE").length;

  const drift = scoreDrift({
    accuracyAvg,
    medianResponseMs,
    rapidGuessCount,
    idleSpikeCount,
    adherenceScore: adherence?.adherenceScore ?? 1,
    latestFocusLevel: latestCheckIn?.focusLevel ?? null,
  });

  const assessment = await DriftAssessmentModel.create({
    userId: userObjectId,
    riskScore: drift.riskScore,
    riskLevel: drift.riskLevel,
    reasons: drift.reasons,
    assessedAt: new Date(),
  });
  return assessment.toObject();
}
