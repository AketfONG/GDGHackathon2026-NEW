import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { ScheduleAdherenceModel } from "@/models/ScheduleAdherence";

const adherenceSchema = z.object({
  plannedMinutes: z.number().int().min(0),
  actualMinutes: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const body = await req.json();
  const parsed = adherenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const adherenceScore =
    parsed.data.plannedMinutes === 0
      ? 1
      : Number((parsed.data.actualMinutes / parsed.data.plannedMinutes).toFixed(2));

  const adherence = await ScheduleAdherenceModel.create({
    userId: auth.user._id,
    date: new Date(),
    plannedMinutes: parsed.data.plannedMinutes,
    actualMinutes: parsed.data.actualMinutes,
    adherenceScore,
  });

  const cycle = await runInterventionCycle(String(auth.user._id));
  return NextResponse.json({ adherence: adherence.toObject(), assessment: cycle.assessment, intervention: cycle.intervention });
}
