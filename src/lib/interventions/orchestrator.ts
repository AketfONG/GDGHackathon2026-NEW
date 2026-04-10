import { InterventionType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { evaluateMicroSlip } from "@/lib/drift/microslip";

function buildMessage(type: InterventionType) {
  switch (type) {
    case "RECAP_2MIN":
      return "Take a 2-minute recap: summarize the last concept in 3 bullets.";
    case "CONFIDENCE_RESET":
      return "Confidence reset: answer one easier checkpoint question first.";
    case "SWITCH_DIFFICULTY":
      return "Switch difficulty for 1 round to regain momentum.";
    case "SCHEDULE_REPLAN":
      return "Quick replan: shift today’s missed block to the next free slot.";
    case "MENTOR_PING":
      return "You are in sustained high risk. Ping a mentor for a 10-minute unblock.";
    default:
      return "Stay on track with a quick reset action.";
  }
}

export async function runInterventionCycle(userId: string) {
  const assessment = await evaluateMicroSlip(userId);

  const cooldownBoundary = new Date(Date.now() - 30 * 60 * 1000);
  const recentIntervention = await db.interventionAction.findFirst({
    where: {
      userId,
      createdAt: { gte: cooldownBoundary },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentIntervention) {
    return { assessment, intervention: null, skipped: true };
  }

  const type: InterventionType =
    assessment.riskLevel === "HIGH"
      ? "MENTOR_PING"
      : assessment.riskLevel === "MEDIUM"
        ? "SCHEDULE_REPLAN"
        : "RECAP_2MIN";

  const intervention = await db.interventionAction.create({
    data: {
      userId,
      type,
      triggerReasons: assessment.reasons as Prisma.InputJsonValue,
      message: buildMessage(type),
      status: "PENDING",
      cooldownUntil: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return { assessment, intervention, skipped: false };
}
