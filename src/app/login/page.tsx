"use client";

import { FormEvent, useState } from "react";
import { TopNav } from "@/components/top-nav";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    //setStatus("Login is currently UI-only. Backend auth is disabled for now.");
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8">
        <section className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
          <form onSubmit={handleSubmit} className="mt-4">
            <label className="mb-2 block text-sm">
              Email
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="mb-3 block text-sm">
              Password
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
        </section>
      </main>
    </div>
  );
}
