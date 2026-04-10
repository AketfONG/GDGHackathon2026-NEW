"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { QuizTodoList } from "@/components/quiz-todo-list";
import { StudyCalendar } from "@/components/study-calendar";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { useState } from "react";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Study Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Track your progress, identify unclear concepts, and review challenging topics.
          </p>
          <div className="mt-3">
            <GoogleAuthButton loginOnly />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Study Schedule</h2>
                <Link
                  href="/schedule"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Full Schedule →
                </Link>
              </div>
              <StudyCalendar
                tasks={[]}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
              <p className="mt-4 text-center text-sm text-slate-500">
                No events yet. Add tasks on the Schedule page after you have materials to study.
              </p>
            </div>

            {selectedDate && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-base font-semibold text-slate-900">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                <p className="text-sm text-slate-500">Nothing scheduled for this day.</p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Tests &amp; quizzes</h2>
              <p className="mb-4 text-sm text-slate-600">
                Cold tests only appear after you upload files and generate a quiz. There are no sample tests.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/upload"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Upload materials
                </Link>
                <Link
                  href="/quizzes"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  View quizzes
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Your cold tests</h2>
              <QuizTodoList quizzes={[]} loading={false} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Unclear concepts</h2>
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                Nothing here yet. Complete quizzes and check-ins to surface topics that need work.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
