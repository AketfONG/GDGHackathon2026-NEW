import { NextRequest, NextResponse } from "next/server";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  const result = await runInterventionCycle(String(auth.user._id));
  return NextResponse.json(result);
}
