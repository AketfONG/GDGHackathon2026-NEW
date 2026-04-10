import { db } from "@/lib/db";

export async function ensureDemoUser() {
  const email = "student@gdghack.local";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing;
  return db.user.create({
    data: {
      name: "Demo Student",
      email,
      goal: "Finish DSA and web fundamentals by semester break",
    },
  });
}
