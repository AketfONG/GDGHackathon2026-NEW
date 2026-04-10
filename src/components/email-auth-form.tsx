"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

type AuthMode = "login" | "signup";

export function EmailAuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (!firebaseAuth) {
    return (
      <p className="text-sm text-slate-600">
        Firebase client keys are not set yet. Add them in <code>.env.local</code>.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
        setMessage("Account created. You are now logged in.");
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        setMessage("Logged in successfully.");
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-credential":
            setMessage("Invalid email or password.");
            break;
          case "auth/email-already-in-use":
            setMessage("This email is already used. Try login instead.");
            break;
          case "auth/weak-password":
            setMessage("Password is too weak. Use at least 6 characters.");
            break;
          case "auth/operation-not-allowed":
            setMessage("Email/password login is disabled in Firebase settings.");
            break;
          default:
            setMessage("Authentication failed. Check Firebase Auth configuration.");
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
    setBusy(true);
    setMessage("");
    try {
      await signOut(firebaseAuth);
      setMessage("Logged out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md px-3 py-1 text-sm ${mode === "login" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-md px-3 py-1 text-sm ${mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {mode === "signup" ? "Create Account" : "Login"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Logout
          </button>
        </div>
      </form>
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
