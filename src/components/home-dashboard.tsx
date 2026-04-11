"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { QuizTodoList, type ColdTestTodo } from "@/components/quiz-todo-list";
import { StudyCalendar } from "@/components/study-calendar";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { taskQuizHref, type ScheduledStudyTask } from "@/lib/scheduled-quizzes";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useMemo, useState } from "react";
import type { IcsEventView } from "@/components/dashboard-calendar-quizzes";
import { dateToLocalYmd } from "@/lib/calendar-dates";
import {
  getScheduleTaskTypeColor,
  getScheduleTaskTypeLabel,
} from "@/lib/schedule-task-palette";

const TIME_LOCALE = "en-US";

function formatIcsSlot(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const datePart = s.toLocaleDateString(TIME_LOCALE, { weekday: "short", month: "short", day: "numeric" });
  const t0 = s.toLocaleTimeString(TIME_LOCALE, { hour: "numeric", minute: "2-digit" });
  const t1 = e.toLocaleTimeString(TIME_LOCALE, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${t0} – ${t1}`;
}

type ReviewFocusItem = { quizId: string; course: string; concept: string; dueDate: string };

type HomeDashboardProps = {
  coldTests: ColdTestTodo[];
  coldTestsLoadFailed: boolean;
  scheduleTasks: ScheduledStudyTask[];
  reviewFocusConcepts: ReviewFocusItem[];
};

export function HomeDashboard({
  coldTests,
  coldTestsLoadFailed,
  scheduleTasks,
  reviewFocusConcepts,
}: HomeDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [icsEvents, setIcsEvents] = useState<IcsEventView[]>([]);
  const [settings] = useUserSettings();

  const icsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return icsEvents.filter((e) => dateToLocalYmd(new Date(e.start)) === selectedDate);
  }, [icsEvents, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <section className="mb-8 space-y-4">
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
                  onIcsEventsChange={setIcsEvents}
                />
              </div>
              {scheduleTasks.length === 0 ? (
                <p className="mt-3 shrink-0 text-center text-sm text-slate-500">
                  No events yet. Add tasks on the Schedule page after you have materials to study.
                </p>
              ) : (
                <p className="mt-3 shrink-0 text-center text-xs leading-relaxed text-slate-500">
                  Blue = day with tasks, emerald = .ics only (same legend as full schedule). Click a day — details appear in
                  the panel below.{" "}
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
                    ? new Date(selectedDate + "T12:00:00").toLocaleDateString(TIME_LOCALE, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Schedule for selected day"}
                </h2>
                <p className="mt-0.5 shrink-0 text-xs text-slate-500">
                  Quizzes/study tasks and imported calendar blocks for the day you tap.
                </p>
                <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-md border border-slate-100 bg-slate-50/40 px-1 pt-1 pb-4 [scrollbar-gutter:stable]">
                  {!selectedDate ? (
                    <p className="py-2 text-sm leading-relaxed text-slate-500">
                      Tap a day on the calendar (blue / emerald, matching the full schedule) to list tasks and class times
                      here.
                    </p>
                  ) : (
                    (() => {
                      const dayTasks = scheduleTasks.filter((t) => t.date === selectedDate);
                      const hasTasks = dayTasks.length > 0;
                      const hasIcs = icsOnSelectedDate.length > 0;
                      if (!hasTasks && !hasIcs) {
                        return (
                          <p className="py-2 text-sm leading-relaxed text-slate-500">
                            No preset quizzes and no .ics events on this date. Try another day or upload a calendar on
                            the mini calendar above.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-4 py-1">
                          {hasTasks ? (
                            <div>
                              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-800">
                                Quizzes & study
                              </h3>
                              <ul className="space-y-2">
                                {dayTasks.map((task) => {
                                  const colors = getScheduleTaskTypeColor(task.type);
                                  return (
                                    <li
                                      key={`${task.date}-${task.type}-${task.id}`}
                                      className={`rounded-lg border-2 border-slate-300 p-2.5 text-sm transition-shadow hover:shadow-md ${colors.bg}`}
                                    >
                                      <p className={`text-xs font-semibold ${colors.text}`}>
                                        {getScheduleTaskTypeLabel(task.type)}
                                      </p>
                                      <p className="mt-1 font-medium text-slate-900">{task.topic}</p>
                                      <p className="mt-0.5 text-slate-800">{task.title}</p>
                                      <p className="mt-1 text-xs text-slate-700">{task.time}</p>
                                      <Link
                                        href={taskQuizHref(task)}
                                        className="mt-1.5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                                      >
                                        Open quiz →
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}
                          {hasIcs ? (
                            <div>
                              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-900">
                                Imported calendar
                              </h3>
                              <ul className="space-y-2">
                                {icsOnSelectedDate.map((ev) => (
                                  <li
                                    key={`${ev.uid}-${ev.start}`}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-sm"
                                  >
                                    <p className="font-medium text-slate-900">{ev.title}</p>
                                    <p className="mt-1 text-xs text-slate-700">{formatIcsSlot(ev.start, ev.end)}</p>
                                    {ev.location ? (
                                      <p className="mt-0.5 text-xs text-slate-600">{ev.location}</p>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
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
