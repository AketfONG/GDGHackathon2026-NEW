"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { QuizTodoList, type ColdTestTodo } from "@/components/quiz-todo-list";
import { StudyCalendar } from "@/components/study-calendar";
import { GoogleAuthButton } from "@/components/google-auth-button";
import {
  getUpcomingReviewQuizConcepts,
  taskQuizHref,
  type ScheduledStudyTask,
} from "@/lib/scheduled-quizzes";
import { useUserSettings } from "@/hooks/use-user-settings";
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

type HomeDashboardProps = {
  coldTests: ColdTestTodo[];
  coldTestsLoadFailed: boolean;
  scheduleTasks: ScheduledStudyTask[];
};

export function HomeDashboard({ coldTests, coldTestsLoadFailed, scheduleTasks }: HomeDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [settings] = useUserSettings();
  const reviewFocusConcepts = useMemo(() => getUpcomingReviewQuizConcepts(), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <section className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4">
            <h1 className="text-3xl font-semibold text-slate-900">Study Dashboard</h1>
            <p className="max-w-2xl text-base text-slate-600 sm:min-w-0 sm:flex-1">
              Track your progress, identify unclear concepts, and review challenging topics.
            </p>
          </div>
          <div className="mt-3">
            <GoogleAuthButton loginOnly />
          </div>
        </section>

        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="flex min-h-0 flex-col lg:h-full lg:min-h-[1px]">
            <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-3 flex shrink-0 items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Study Schedule</h2>
                <Link
                  href="/schedule"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Full Schedule →
                </Link>
              </div>
              <div className="shrink-0">
                <StudyCalendar
                  tasks={scheduleTasks}
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                  weekStartsOn={settings.calendarWeekStartsOn}
                  compact
                />
              </div>
              {scheduleTasks.length === 0 ? (
                <p className="mt-3 shrink-0 text-center text-sm text-slate-500">
                  No events yet. Add tasks on the Schedule page after you have materials to study.
                </p>
              ) : (
                <p className="mt-3 shrink-0 text-center text-xs leading-relaxed text-slate-500">
                  Blue days: quiz or review. Click a date for tasks below (in the right column).{" "}
                  <Link href="/schedule" className="font-semibold text-blue-600 hover:text-blue-700">
                    Full schedule →
                  </Link>
                </p>
              )}
              <div className="min-h-0 flex-1" aria-hidden />
            </div>
          </div>

          <div className="flex min-h-0 flex-col lg:h-full lg:min-h-[1px]">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
              {/* Three equal vertical bands; scroll regions cap ~2 / ~3 / ~2 items then scroll */}
              <section className="flex min-h-0 flex-1 basis-0 flex-col border-b border-slate-200 px-3 pt-3 pb-2">
                <h2 className="shrink-0 text-lg font-semibold text-slate-900">Your cold tests</h2>
                <div className="mt-1.5 max-h-40 min-h-0 shrink-0 overflow-y-auto overscroll-y-contain rounded-md border border-slate-100 bg-slate-50/40 pr-0.5 pl-1 pt-1">
                  <QuizTodoList
                    quizzes={coldTests}
                    loading={false}
                    loadFailed={coldTestsLoadFailed}
                    compact
                  />
                </div>
                <div className="min-h-0 flex-1" aria-hidden />
              </section>

              <section className="flex min-h-0 flex-1 basis-0 flex-col border-b border-slate-200 px-3 py-2">
                <h2 className="shrink-0 text-lg font-semibold text-slate-900">Unclear concepts</h2>
                <p className="mt-0.5 shrink-0 text-xs text-slate-500">
                  Topics from upcoming review quizzes (due today or later).
                </p>
                <div className="mt-1.5 max-h-44 min-h-0 shrink-0 overflow-y-auto overscroll-y-contain rounded-md border border-slate-100 bg-slate-50/40 pr-0.5 pl-1">
                  {reviewFocusConcepts.length === 0 ? (
                    <p className="py-2 text-sm text-slate-500">
                      No upcoming review quizzes — check back after new review dates are scheduled.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 py-1">
                      {reviewFocusConcepts.map(({ quizId, course, concept, dueDate }) => (
                        <li key={quizId}>
                          <Link
                            href={`/quizzes/${encodeURIComponent(quizId)}`}
                            className="flex flex-col gap-0.5 rounded-md border border-amber-200 bg-amber-50/80 px-2.5 py-2 transition-colors hover:border-amber-300 hover:bg-amber-100/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                              <span className="text-sm font-semibold text-slate-900">{course}</span>
                              <span className="text-sm text-slate-700">{concept}</span>
                            </div>
                            <span className="shrink-0 text-xs text-slate-500" suppressHydrationWarning>
                              Due{" "}
                              {new Date(dueDate + "T12:00:00").toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="min-h-0 flex-1" aria-hidden />
              </section>

              <section className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden px-3 pb-3 pt-2">
                <h2 className="shrink-0 text-lg font-semibold text-slate-900" suppressHydrationWarning>
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00Z").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : "Selected date"}
                </h2>
                <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-md border border-slate-100 bg-slate-50/40 px-1 pt-1 pb-4 [scrollbar-gutter:stable]">
                  {!selectedDate ? (
                    <p className="py-2 text-sm leading-relaxed text-slate-500">
                      Click a highlighted day on the calendar to see quizzes due that day.
                    </p>
                  ) : (
                    (() => {
                      const dayTasks = scheduleTasks.filter((t) => t.date === selectedDate);
                      if (dayTasks.length === 0) {
                        return (
                          <p className="py-2 text-sm leading-relaxed text-slate-500">
                            Nothing scheduled for this day.
                          </p>
                        );
                      }
                      return (
                        <ul className="space-y-2">
                          {dayTasks.map((task) => (
                            <li
                              key={`${task.date}-${task.type}-${task.id}`}
                              className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-semibold ${taskTypeStyles(task.type)}`}
                                >
                                  {taskTypeLabel(task.type)}
                                </span>
                                <span className="font-medium text-slate-900">{task.topic}</span>
                              </div>
                              <p className="mt-1 text-slate-800">{task.title}</p>
                              <p className="mt-0.5 text-xs text-slate-600">{task.time}</p>
                              <Link
                                href={taskQuizHref(task)}
                                className="mt-1.5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Open quiz →
                              </Link>
                            </li>
                          ))}
                        </ul>
                      );
                    })()
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
