import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

export async function GET() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const latestAssessments = await db.driftAssessment.findMany({
    orderBy: { assessedAt: "desc" },
    include: { user: true },
    take: 100,
  });

  const seen = new Set<string>();
  const rows = latestAssessments
    .filter((item) => {
      if (seen.has(item.userId)) return false;
      seen.add(item.userId);
      return item.riskLevel !== "LOW";
    })
    .map((item) => ({
      userId: item.userId,
      name: item.user.name,
      email: item.user.email,
      riskScore: item.riskScore,
      riskLevel: item.riskLevel,
      reasons: item.reasons,
      assessedAt: item.assessedAt,
    }))
    .sort((a, b) => b.riskScore - a.riskScore);

  return NextResponse.json({ students: rows });
}
