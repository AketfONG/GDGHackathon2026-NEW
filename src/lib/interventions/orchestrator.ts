import { evaluateMicroSlip } from "@/lib/drift/microslip";
import { InterventionActionModel } from "@/models/InterventionAction";
import { connectToDatabase } from "@/lib/mongodb";
import { Types } from "mongoose";

type InterventionType =
  | "RECAP_2MIN"
  | "CONFIDENCE_RESET"
  | "SWITCH_DIFFICULTY"
  | "SCHEDULE_REPLAN"
  | "MENTOR_PING";

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
  await connectToDatabase();
  const assessment = await evaluateMicroSlip(userId);
  const userObjectId = new Types.ObjectId(userId);

  const cooldownBoundary = new Date(Date.now() - 30 * 60 * 1000);
  const recentIntervention = await InterventionActionModel.findOne({
    userId: userObjectId,
    createdAt: { $gte: cooldownBoundary },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (recentIntervention) {
    return { assessment, intervention: null, skipped: true };
  }

  const type: InterventionType =
    assessment.riskLevel === "HIGH"
      ? "MENTOR_PING"
      : assessment.riskLevel === "MEDIUM"
        ? "SCHEDULE_REPLAN"
        : "RECAP_2MIN";

  const intervention = await InterventionActionModel.create({
    userId: userObjectId,
    type,
    triggerReasons: assessment.reasons,
    message: buildMessage(type),
    status: "PENDING",
    cooldownUntil: new Date(Date.now() + 30 * 60 * 1000),
  });

  return { assessment, intervention: intervention.toObject(), skipped: false };
}
