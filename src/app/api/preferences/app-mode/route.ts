import { NextRequest, NextResponse } from "next/server";
import { APP_DEMO_MODE_COOKIE, getDemoModeFromCookieStore, type AppDemoMode } from "@/lib/app-demo-mode";

const MAX_AGE_SEC = 60 * 60 * 24 * 400; // ~400 days

export async function GET(req: NextRequest) {
  const mode = getDemoModeFromCookieStore(req.cookies);
  return NextResponse.json({ mode });
}

export async function POST(req: NextRequest) {
  let body: { mode?: string };
  try {
    body = (await req.json()) as { mode?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const next: AppDemoMode = body.mode === "demo" ? "demo" : "live";
  const res = NextResponse.json({ ok: true, mode: next });
  res.cookies.set(APP_DEMO_MODE_COOKIE, next, {
    path: "/",
    maxAge: MAX_AGE_SEC,
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
