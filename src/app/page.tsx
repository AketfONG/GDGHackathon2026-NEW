"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { QuizTodoList } from "@/components/quiz-todo-list";
import { StudyCalendar } from "@/components/study-calendar";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { getScheduledStudyTasks, type ScheduledStudyTask } from "@/lib/scheduled-quizzes";
import { useMemo, useState } from "react";

function taskTypeStyles(type: ScheduledStudyTask["type"]) {
  switch (type) {
    case "hot_quiz":
      return "bg-red-100 text-red-800";
    case "review_quiz":
      return "bg-green-100 text-green-800";
    case "cold_quiz":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function taskTypeLabel(type: ScheduledStudyTask["type"]) {
  switch (type) {
    case "hot_quiz":
      return "Hot quiz";
    case "review_quiz":
      return "Review";
    case "cold_quiz":
      return "Cold quiz";
    default:
      return "Study";
  }
}

const HOME_UNCLEAR_CONCEPTS = [
  { course: "TEMG3950", concept: "Root Cause Analysis" },
  { course: "COMP3511", concept: "Operating Systems" },
  { course: "ECON2103", concept: "Monopoly" },
] as const;

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const scheduleTasks = useMemo(() => getScheduledStudyTasks(), []);

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
                tasks={scheduleTasks}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
              {scheduleTasks.length === 0 ? (
                <p className="mt-4 text-center text-sm text-slate-500">
                  No events yet. Add tasks on the Schedule page after you have materials to study.
                </p>
              ) : (
                <p className="mt-4 text-center text-sm text-slate-500">
                  Blue days have a quiz or review. Open{" "}
                  <Link href="/schedule" className="font-semibold text-blue-600 hover:text-blue-700">
                    Schedule
                  </Link>{" "}
                  for details.
                </p>
              )}
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
                {(() => {
                  const dayTasks = scheduleTasks.filter((t) => t.date === selectedDate);
                  if (dayTasks.length === 0) {
                    return <p className="text-sm text-slate-500">Nothing scheduled for this day.</p>;
                  }
                  return (
                    <ul className="space-y-3">
                      {dayTasks.map((task) => (
                        <li
                          key={task.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ${taskTypeStyles(task.type)}`}
                            >
                              {taskTypeLabel(task.type)}
                            </span>
                            <span className="font-medium text-slate-900">{task.topic}</span>
                          </div>
                          <p className="mt-1 text-slate-800">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{task.time}</p>
                          <Link
                            href={`/quizzes/${encodeURIComponent(task.id)}`}
                            className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Open quiz →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Tests &amp; quizzes</h2>
              <p className="mb-4 text-sm text-slate-600">
                Hot and review items for MATH2411, HUMA2104, and TEMG3950 are on the Quizzes page with due dates.
                Cold tests still require an upload.
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
              <ul className="space-y-3">
                {HOME_UNCLEAR_CONCEPTS.map(({ course, concept }) => (
                  <li
                    key={course}
                    className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-semibold text-slate-900">{course}</span>
                    <span className="text-sm text-slate-700">{concept}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
