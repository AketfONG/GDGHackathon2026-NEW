import { NextResponse } from "next/server";

export function isBackendDisabled() {
  return process.env.BACKEND_DISABLED === "true";
}

export function backendDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      backendDisabled: true,
      message: "Backend is disabled for UI prototype mode.",
    },
    { status: 503 },
  );
}
