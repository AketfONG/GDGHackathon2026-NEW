import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/demo-user";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

export async function POST() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const user = await ensureDemoUser();
  const result = await runInterventionCycle(user.id);
  return NextResponse.json(result);
}
