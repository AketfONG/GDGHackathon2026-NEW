import { NextRequest, NextResponse } from "next/server";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { TimetableBlockModel } from "@/models/TimetableBlock";
import { ObligationModel } from "@/models/Obligation";
import { ScheduleAdherenceModel } from "@/models/ScheduleAdherence";

export async function GET(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();

  const [blocks, obligations, latestAdherence] = await Promise.all([
    TimetableBlockModel.find({ userId: auth.user._id }).lean(),
    ObligationModel.find({ userId: auth.user._id }).lean(),
    ScheduleAdherenceModel.findOne({ userId: auth.user._id }).sort({ createdAt: -1 }).lean(),
  ]);

  return NextResponse.json({ blocks, obligations, latestAdherence });
}
