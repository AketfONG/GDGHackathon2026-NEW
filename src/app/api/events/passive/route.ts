import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { PassiveSignalEventModel } from "@/models/PassiveSignalEvent";

const passiveEventSchema = z.object({
  type: z.enum(["IDLE_SPIKE", "RAPID_GUESS", "HINT_OVERUSE", "SESSION_END"]),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const body = await req.json();
  const parsed = passiveEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureDemoUser();
  const event = await db.passiveSignalEvent.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      meta: parsed.data.meta
        ? (JSON.parse(JSON.stringify(parsed.data.meta)) as any)
        : undefined,
    },
  const user = auth.user;
  const event = await PassiveSignalEventModel.create({
    userId: user._id,
    type: parsed.data.type,
    meta: parsed.data.meta ? JSON.parse(JSON.stringify(parsed.data.meta)) : undefined,
  });

  const cycle = await runInterventionCycle(String(user._id));
  return NextResponse.json({ event: event.toObject(), assessment: cycle.assessment, intervention: cycle.intervention });
}
