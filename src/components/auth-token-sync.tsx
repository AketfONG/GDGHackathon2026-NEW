"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { syncSessionCookie } from "@/lib/auth/session-sync";

export function AuthTokenSync() {
  useEffect(() => {
    if (!firebaseAuth) return;

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      try {
        await syncSessionCookie(user);
      } catch {
        // Best-effort sync; auth UI still works client-side.
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
