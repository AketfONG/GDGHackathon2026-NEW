"use client";

import { useEffect, useState } from "react";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";

export function GoogleAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!firebaseAuth) return;
    const unsub = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
    });
    return () => unsub();
  }, []);

  async function handleLogin() {
    if (!firebaseAuth || !googleProvider) return;
    setBusy(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!firebaseAuth) return;
    setBusy(true);
  if (!firebaseAuth || !googleProvider) {
    return (
      <p className="text-sm text-slate-600">
        Firebase client keys are not set yet. Add them in <code>.env.local</code> to enable Google login.
      </p>
    );
  }

    try {
      await signOut(firebaseAuth);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-700">{user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={busy}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={busy}
      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
    >
      Sign in with Google
    </button>
  );
}
