import { db } from "@/lib/db";
import { scoreDrift } from "@/lib/drift/score";
import { Prisma } from "@prisma/client";

export async function evaluateMicroSlip(userId: string) {
  const [attempts, passiveEvents, latestCheckIn, adherence] = await Promise.all([
    db.quizAttempt.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: { questionAttempts: true },
    }),
    db.passiveSignalEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.checkIn.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.scheduleAdherence.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
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

  return db.driftAssessment.create({
    data: {
      userId,
      riskScore: drift.riskScore,
      riskLevel: drift.riskLevel,
      reasons: drift.reasons as Prisma.InputJsonValue,
    },
  });
}
