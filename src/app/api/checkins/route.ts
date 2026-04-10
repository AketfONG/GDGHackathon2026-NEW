import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

const checkInSchema = z.object({
  focusLevel: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  confidence: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureDemoUser();
  const checkIn = await db.checkIn.create({
    data: {
      userId: user.id,
      ...parsed.data,
    },
  });

  const cycle = await runInterventionCycle(user.id);
  return NextResponse.json({ checkIn, assessment: cycle.assessment, intervention: cycle.intervention });
}
