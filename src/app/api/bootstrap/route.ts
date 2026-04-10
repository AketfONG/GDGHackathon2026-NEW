import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST() {
  if (isBackendDisabled()) return backendDisabledResponse();
  await connectToDatabase();
  const user = await ensureDemoUser();

  return NextResponse.json({ ok: true, userId: String(user._id) });
}
