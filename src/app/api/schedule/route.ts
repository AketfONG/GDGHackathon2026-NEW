import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

export async function GET() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const user = await ensureDemoUser();
  const [blocks, obligations, latestAdherence] = await Promise.all([
    db.timetableBlock.findMany({ where: { userId: user.id } }),
    db.obligation.findMany({ where: { userId: user.id } }),
    db.scheduleAdherence.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({ blocks, obligations, latestAdherence });
}
