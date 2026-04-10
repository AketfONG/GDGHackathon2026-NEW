"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { syncSessionCookie } from "@/lib/auth/session-sync";

type AuthMode = "login" | "signup";

export function EmailAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!firebaseAuth) {
    return (
      <p className="text-sm text-slate-600">
        Firebase client keys are not set yet. Add them in <code>.env.local</code>.
      </p>
    );
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setIsLoggedIn(Boolean(user));
      if (!user) {
        // Clear stale form state after logout.
        setEmail("");
        setPassword("");
        setMessage("");
      }
    });
    return () => unsub();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await syncSessionCookie(credential.user);
        setMessage("Account created. You are now logged in.");
      } else {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        await syncSessionCookie(credential.user);
        setMessage("Logged in successfully.");
      }
      router.refresh();
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-credential":
            setMessage("Invalid email or password.");
            break;
          case "auth/invalid-email":
            setMessage("Invalid email format.");
            break;
          case "auth/email-already-in-use":
            setMessage("This email is already used. Try login instead.");
            break;
          case "auth/weak-password":
            setMessage("Password is too weak. Use at least 6 characters.");
            break;
          case "auth/operation-not-allowed":
            setMessage("Email/password sign-in is disabled in Firebase Auth. Enable Email/Password in Firebase Console.");
            break;
          case "auth/network-request-failed":
            setMessage("Network error while contacting Firebase. Check connection and try again.");
            break;
          case "auth/too-many-requests":
            setMessage("Too many attempts. Please wait a minute and try again.");
            break;
          default:
            setMessage(`Authentication failed (${error.code}). Check Firebase Auth configuration.`);
            break;
        }
      } else {
        setMessage("Authentication failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    const confirmed = window.confirm("Do you want to log out?");
    if (!confirmed) return;
    setBusy(true);
    setMessage("");
    try {
      await signOut(firebaseAuth);
      await syncSessionCookie(null);
      setMessage("Logged out.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-2" autoComplete="off">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="off"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-600">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-sky-600 hover:text-sky-700"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {mode === "signup" ? "Create Account" : "Login"}
          </button>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Logout
            </button>
          ) : null}
        </div>
      </form>
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
