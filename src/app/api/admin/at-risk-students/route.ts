import { NextRequest, NextResponse } from "next/server";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { DriftAssessmentModel } from "@/models/DriftAssessment";
import { UserModel } from "@/models/User";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  await connectToDatabase();
  const latestAssessments = await DriftAssessmentModel.find({})
    .sort({ assessedAt: -1 })
    .limit(100)
    .lean();

  const userIds = Array.from(new Set(latestAssessments.map((a) => String(a.userId))));
  const users = await UserModel.find({
    _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
  })
    .lean()
    .then((rows) => new Map(rows.map((u) => [String(u._id), u])));

  const seen = new Set<string>();
  const rows = latestAssessments
    .filter((item: typeof latestAssessments[0]) => {
      if (seen.has(item.userId)) return false;
      seen.add(item.userId);
      return item.riskLevel !== "LOW";
    })
    .map((item: typeof latestAssessments[0]) => ({
      userId: item.userId,
      name: item.user.name,
      email: item.user.email,
    .filter((item) => {
      const userId = String(item.userId);
      if (seen.has(userId)) return false;
      seen.add(userId);
      return item.riskLevel !== "LOW";
    })
    .map((item) => ({
      userId: String(item.userId),
      name: users.get(String(item.userId))?.name ?? "Unknown",
      email: users.get(String(item.userId))?.email ?? "Unknown",
      riskScore: item.riskScore,
      riskLevel: item.riskLevel,
      reasons: item.reasons,
      assessedAt: item.assessedAt,
    }))
    .sort((a: any, b: any) => b.riskScore - a.riskScore);

  return NextResponse.json({ students: rows });
}
