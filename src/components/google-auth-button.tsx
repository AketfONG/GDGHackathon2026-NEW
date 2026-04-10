"use client";

import { useEffect, useState } from "react";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";

export function GoogleAuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

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
    setErrorText("");
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/configuration-not-found") {
        setErrorText("Google sign-in is not enabled in Firebase Auth settings.");
      } else {
        setErrorText("Login failed. Please check Firebase Auth configuration.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!firebaseAuth) return;
    setBusy(true);
    setErrorText("");
    try {
      await signOut(firebaseAuth);
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseAuth || !googleProvider) {
    return (
      <p className="text-sm text-slate-600">
        Firebase client keys are not set yet. Add them in <code>.env.local</code> to enable Google login.
      </p>
    );
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
        {errorText ? <p className="w-full text-xs text-rose-600">{errorText}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
      >
        Sign in with Google
      </button>
      {errorText ? <p className="text-xs text-rose-600">{errorText}</p> : null}
    </div>
  );
}
