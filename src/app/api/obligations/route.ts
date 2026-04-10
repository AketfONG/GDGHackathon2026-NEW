import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

const obligationSchema = z.object({
  title: z.string().min(2),
  dayOfWeek: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1439),
  endMinutes: z.number().int().min(1).max(1440),
  nonSkippable: z.boolean().default(true),
});

export async function GET() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const user = await ensureDemoUser();
  const obligations = await db.obligation.findMany({
    where: { userId: user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
  });
  return NextResponse.json({ obligations });
}

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const body = await req.json();
  const parsed = obligationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.startMinutes >= parsed.data.endMinutes) {
    return NextResponse.json({ error: "startMinutes must be less than endMinutes" }, { status: 400 });
  }

  const user = await ensureDemoUser();
  const obligation = await db.obligation.create({
    data: {
      userId: user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ obligation }, { status: 201 });
}
