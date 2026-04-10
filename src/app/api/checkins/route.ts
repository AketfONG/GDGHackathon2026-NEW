import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { CheckInModel } from "@/models/CheckIn";

const checkInSchema = z.object({
  focusLevel: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  confidence: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const body = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = auth.user;
  const checkIn = await CheckInModel.create({
    userId: user._id,
    ...parsed.data,
  });

  const cycle = await runInterventionCycle(String(user._id));
  return NextResponse.json({ checkIn: checkIn.toObject(), assessment: cycle.assessment, intervention: cycle.intervention });
}
