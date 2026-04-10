import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

export async function verifyRequestToken(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return { ok: false as const, response: NextResponse.json({ error: "Missing auth token" }, { status: 401 }) };
  }

  const idToken = header.replace("Bearer ", "").trim();
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
    return { ok: false as const, response: NextResponse.json({ error: "Invalid auth token" }, { status: 401 }) };
  }
}
