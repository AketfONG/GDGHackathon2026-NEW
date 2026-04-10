"use client";

import { User } from "firebase/auth";

export async function syncSessionCookie(user: User | null) {
  const token = user ? await user.getIdToken(true) : "";
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });
}
