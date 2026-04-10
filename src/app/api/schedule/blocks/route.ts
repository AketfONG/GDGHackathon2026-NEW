import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { TimetableBlockModel } from "@/models/TimetableBlock";

const blockSchema = z.object({
  title: z.string().min(2),
  goalTag: z.string().min(2),
  dayOfWeek: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1439),
  endMinutes: z.number().int().min(1).max(1440),
  nonSkippable: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const blocks = await TimetableBlockModel.find({ userId: auth.user._id })
    .sort({ dayOfWeek: 1, startMinutes: 1 })
    .lean();
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const body = await req.json();
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.startMinutes >= parsed.data.endMinutes) {
    return NextResponse.json({ error: "startMinutes must be less than endMinutes" }, { status: 400 });
  }

  const block = await TimetableBlockModel.create({ userId: auth.user._id, ...parsed.data });

  return NextResponse.json({ block: block.toObject() }, { status: 201 });
}
