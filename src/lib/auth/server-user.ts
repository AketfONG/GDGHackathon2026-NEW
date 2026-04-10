import { cookies } from "next/headers";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ensureDemoUser } from "@/lib/demo-user";

const SESSION_COOKIE_NAME = "firebase_id_token";
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";

/** Same identity rules as API routes: session cookie → Firebase user, else demo user when auth is optional. */
export async function getServerUser() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "";

  if (!idToken) {
    if (REQUIRE_AUTH) return null;
    return ensureDemoUser();
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
    await connectToDatabase();

    const existing = await UserModel.findOne({ firebaseUid: decoded.uid });
    if (existing) return existing;

    return await UserModel.create({
      firebaseUid: decoded.uid,
      name: decoded.name ?? "Student",
      email: decoded.email ?? `${decoded.uid}@firebase.local`,
      role: "STUDENT",
      goal: null,
    });
  } catch {
    if (REQUIRE_AUTH) return null;
    return ensureDemoUser();
  }
}
