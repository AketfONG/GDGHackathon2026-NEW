import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

export async function GET() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const user = await ensureDemoUser();

  const [attempts, latestAssessment, interventions, adherence, scheduleBlocks, obligations] =
    await Promise.all([
      db.quizAttempt.findMany({
        where: { userId: user.id },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      db.driftAssessment.findFirst({
        where: { userId: user.id },
        orderBy: { assessedAt: "desc" },
      }),
      db.interventionAction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.scheduleAdherence.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.timetableBlock.findMany({
        where: { userId: user.id },
      }),
      db.obligation.findMany({
        where: { userId: user.id },
      }),
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
