import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function Home() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">GDG Study Agent</h1>
          <p className="mt-2 text-slate-600">
            Passive observation + autonomous micro-interventions to prevent cumulative minor setbacks.
          </p>
          <div className="mt-3">
            <GoogleAuthButton />
          </div>
          <form action="/api/bootstrap" method="post" className="mt-4">
            <button className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Initialize Demo Data
            </button>
          </form>
        </section>
        <section className="grid gap-3 md:grid-cols-3">
          <Link className="rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50" href="/quizzes">
            Start Quiz Flow
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50" href="/schedule">
            Set Timetable & Obligations
          </Link>
          <Link className="rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50" href="/dashboard">
            View Drift Dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}
