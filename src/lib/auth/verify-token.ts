import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ensureDemoUser } from "@/lib/demo-user";

const SESSION_COOKIE_NAME = "firebase_id_token";
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";

async function resolveFallbackUser() {
  const user = await ensureDemoUser();
  return { ok: true as const, user };
}

export async function verifyRequestToken(req: NextRequest) {
  const header = req.headers.get("authorization");
  const headerToken = header?.startsWith("Bearer ") ? header.replace("Bearer ", "").trim() : "";
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value ?? "";
  const idToken = headerToken || cookieToken;

  if (!idToken) {
    if (REQUIRE_AUTH) {
      return { ok: false as const, response: NextResponse.json({ error: "Missing auth token" }, { status: 401 }) };
    }
    return resolveFallbackUser();
  }
  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
    await connectToDatabase();

    const existing = await UserModel.findOne({ firebaseUid: decoded.uid });
    if (existing) return { ok: true as const, user: existing };

    const created = await UserModel.create({
      firebaseUid: decoded.uid,
      name: decoded.name ?? "Student",
      email: decoded.email ?? `${decoded.uid}@firebase.local`,
      role: "STUDENT",
      goal: null,
    });
    return { ok: true as const, user: created };
  } catch {
    if (REQUIRE_AUTH) {
      return { ok: false as const, response: NextResponse.json({ error: "Invalid auth token" }, { status: 401 }) };
    }
    return resolveFallbackUser();
  }
}
