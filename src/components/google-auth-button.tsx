"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { syncSessionCookie } from "@/lib/auth/session-sync";

export function GoogleAuthButton() {
  const router = useRouter();
  const pathname = usePathname();
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
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      await syncSessionCookie(result.user);
      if (pathname === "/login") {
        router.replace("/");
      } else {
        router.refresh();
      }
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
    const confirmed = window.confirm("Do you want to log out?");
    if (!confirmed) return;
    setBusy(true);
    setErrorText("");
    try {
      await signOut(firebaseAuth);
      await syncSessionCookie(null);
      router.refresh();
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
        <button
          type="button"
          onClick={handleLogout}
          disabled={busy}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          Log out
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
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        Login
      </button>
      {errorText ? <p className="text-xs text-rose-600">{errorText}</p> : null}
    </div>
  );
}
