"use client";

import { firebaseAuth } from "@/lib/firebase/client";

export async function getAuthHeaders() {
  if (!firebaseAuth) return {} as Record<string, string>;
  const user = firebaseAuth.currentUser;
  if (!user) return {} as Record<string, string>;
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}
