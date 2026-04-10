import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

const blockSchema = z.object({
  title: z.string().min(2),
  goalTag: z.string().min(2),
  dayOfWeek: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1439),
  endMinutes: z.number().int().min(1).max(1440),
  nonSkippable: z.boolean().default(false),
});

export async function GET() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const user = await ensureDemoUser();
  const blocks = await db.timetableBlock.findMany({
    where: { userId: user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
  });
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const body = await req.json();
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.startMinutes >= parsed.data.endMinutes) {
    return NextResponse.json({ error: "startMinutes must be less than endMinutes" }, { status: 400 });
  }

  const user = await ensureDemoUser();
  const block = await db.timetableBlock.create({
    data: {
      userId: user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ block }, { status: 201 });
}
