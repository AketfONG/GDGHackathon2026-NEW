"use client";

import { useMemo } from "react";
import { IcsUploadButton } from "@/components/ics-upload-button";
import { useCalendarIcsUpload } from "@/hooks/use-calendar-ics-upload";

export type IcsEventView = {
  uid: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
};

export type QuizAttemptView = {
  id: string;
  title: string;
  submittedAt: string;
  scorePct: number;
};

type Props = {
  initialImport: {
    fileName: string;
    importedAt: string;
    events: IcsEventView[];
  } | null;
  quizAttempts: QuizAttemptView[];
  /** When false, DB/API cannot persist — show banner and disable upload. */
  calendarStorageReady: boolean;
};

const UPCOMING_DAYS = 21;
const PAST_QUIZ_DAYS = 30;

/** Fixed locale so SSR and browser match (avoids hydration mismatches from `undefined` locale). */
const DISPLAY_LOCALE = "en-US";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardCalendarAndQuizzes({
  initialImport,
  quizAttempts,
  calendarStorageReady,
}: Props) {
  const { uploadCalendarIcs, pending, message } = useCalendarIcsUpload();

  const now = useMemo(() => new Date(), []);

  const upcomingIcs = useMemo(() => {
    if (!initialImport?.events.length) return [];
    const end = new Date(now);
    end.setDate(end.getDate() + UPCOMING_DAYS);
    return initialImport.events
      .map((e) => ({ ...e, startD: new Date(e.start), endD: new Date(e.end) }))
      .filter((e) => e.endD >= now && e.startD <= end)
      .sort((a, b) => a.startD.getTime() - b.startD.getTime())
      .slice(0, 50);
  }, [initialImport, now]);

  const recentQuizzes = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - PAST_QUIZ_DAYS);
    return quizAttempts.filter((q) => new Date(q.submittedAt) >= cutoff);
  }, [quizAttempts, now]);

  const weekDays = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [now]);

  const byDay = useMemo(() => {
    const map = new Map<string, { ics: IcsEventView[]; quizzes: QuizAttemptView[] }>();
    for (const d of weekDays) {
      map.set(dayKey(d), { ics: [], quizzes: [] });
    }
    for (const e of initialImport?.events ?? []) {
      const startD = new Date(e.start);
      const k = dayKey(startD);
      if (!map.has(k)) continue;
      map.get(k)!.ics.push(e);
    }
    for (const q of quizAttempts) {
      const k = dayKey(new Date(q.submittedAt));
      if (!map.has(k)) continue;
      map.get(k)!.quizzes.push(q);
    }
    return map;
  }, [initialImport, quizAttempts, weekDays]);

  return (
    <section className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm">
      {!calendarStorageReady ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Calendar upload needs MongoDB. Start your database (or turn off <code className="rounded bg-amber-100 px-1">BACKEND_DISABLED</code>) to
          save .ics files. Risk cards above are hidden for the same reason.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Calendar & quizzes</h2>
          <p className="mt-1 text-sm text-slate-600">
            Import an <code className="rounded bg-slate-100 px-1">.ics</code> file to line up classes and deadlines with your quiz attempts.
          </p>
        </div>
        <IcsUploadButton
          variant="primary"
          disabled={pending || !calendarStorageReady}
          label="Choose .ics calendar file"
          onFile={(file) => uploadCalendarIcs(file, calendarStorageReady)}
        />
      </div>

      {message ? (
        <p
          className={`mt-3 text-sm ${message.kind === "ok" ? "text-emerald-800" : "text-rose-700"}`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      {initialImport ? (
        <p className="mt-2 text-xs text-slate-500">
          Current file: <span className="font-medium text-slate-700">{initialImport.fileName}</span> · imported{" "}
          {new Date(initialImport.importedAt).toLocaleString(DISPLAY_LOCALE, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No calendar uploaded yet — use the green button above.</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">This week</h3>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {weekDays.map((d) => {
              const k = dayKey(d);
              const cell = byDay.get(k);
              const isToday = dayKey(new Date()) === k;
              return (
                <div
                  key={k}
                  className={`flex min-h-[4.5rem] flex-col gap-0.5 rounded border p-1 text-left text-[11px] ${
                    isToday ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="font-semibold text-slate-800">{d.getDate()}</span>
                  {cell && cell.ics.length > 0 ? (
                    <span className="truncate rounded bg-sky-100 px-0.5 text-sky-900" title="Calendar">
                      {cell.ics.length} cal
                    </span>
                  ) : null}
                  {cell && cell.quizzes.length > 0 ? (
                    <span className="truncate rounded bg-violet-100 px-0.5 text-violet-900" title="Quizzes">
                      {cell.quizzes.length} quiz
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-sky-100 ring-1 ring-sky-300" /> Calendar events
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-violet-100 ring-1 ring-violet-300" /> Quiz attempts
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Upcoming schedule (next {UPCOMING_DAYS} days)</h3>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto text-sm">
              {upcomingIcs.length === 0 ? (
                <li className="text-slate-600">
                  No upcoming events in this window — upload a calendar or pick a range with more future events.
                </li>
              ) : (
                upcomingIcs.map((e) => (
                  <li key={`${e.uid}-${e.start}`} className="rounded border border-slate-200 bg-slate-50 p-2">
                    <p className="font-medium text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-600">
                      {fmtRange(e.startD, e.endD)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Recent quizzes</h3>
            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm">
              {recentQuizzes.length === 0 ? (
                <li className="text-slate-600">No quiz attempts in the last {PAST_QUIZ_DAYS} days.</li>
              ) : (
                recentQuizzes.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between rounded border border-slate-200 bg-white px-2 py-1"
                  >
                    <span className="font-medium text-slate-800">{q.title}</span>
                    <span className="text-xs text-slate-600">
                      {new Date(q.submittedAt).toLocaleString(DISPLAY_LOCALE, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {q.scorePct}%
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function fmtRange(start: Date, end: Date) {
  const sameDay = dayKey(start) === dayKey(end);
  const sameDayStartOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const t0 = start.toLocaleString(DISPLAY_LOCALE, sameDayStartOpts);
  if (sameDay) {
    const t1 = end.toLocaleTimeString(DISPLAY_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${t0} – ${t1}`;
  }
  const fullOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return `${start.toLocaleString(DISPLAY_LOCALE, fullOpts)} → ${end.toLocaleString(DISPLAY_LOCALE, fullOpts)}`;
}
