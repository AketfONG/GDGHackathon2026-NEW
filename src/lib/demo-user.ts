import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

export async function ensureDemoUser() {
  await connectToDatabase();
  const firebaseUid = "demo-firebase-uid";
  const email = "student@gdghack.local";
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) return existing;
  const created = await UserModel.create({
    firebaseUid,
    name: "Demo Student",
    email,
    goal: "Finish DSA and web fundamentals by semester break",
  });
  return created.toObject();
}
