import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

const adherenceSchema = z.object({
  plannedMinutes: z.number().int().min(0),
  actualMinutes: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const body = await req.json();
  const parsed = adherenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureDemoUser();
  const adherenceScore =
    parsed.data.plannedMinutes === 0
      ? 1
      : Number((parsed.data.actualMinutes / parsed.data.plannedMinutes).toFixed(2));

  const adherence = await db.scheduleAdherence.create({
    data: {
      userId: user.id,
      date: new Date(),
      plannedMinutes: parsed.data.plannedMinutes,
      actualMinutes: parsed.data.actualMinutes,
      adherenceScore,
    },
  });

  const cycle = await runInterventionCycle(user.id);
  return NextResponse.json({ adherence, assessment: cycle.assessment, intervention: cycle.intervention });
}
