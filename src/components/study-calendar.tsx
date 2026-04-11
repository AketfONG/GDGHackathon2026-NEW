"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { IcsUploadButton } from "@/components/ics-upload-button";
import type { IcsEventView } from "@/components/dashboard-calendar-quizzes";
import { dateToLocalYmd } from "@/lib/calendar-dates";
import { formatIcsUploadSuccessMessage } from "@/lib/ics-upload-message";

/** Normalize task.date to YYYY-MM-DD (full date — not day-of-month only). */
function normalizeTaskYmd(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : dateToLocalYmd(d);
}

interface StudyTask {
  id: string;
  date: string;
  title: string;
  type: "hot_quiz" | "cold_quiz" | "review_quiz" | "study_topic";
  topic: string;
  priority: "high" | "medium" | "low";
  time: string;
  duration: string;
}

interface StudyCalendarProps {
  tasks?: StudyTask[];
  onDateSelect?: (dateStr: string | null) => void;
  selectedDate?: string | null;
  compact?: boolean;
  weekStartsOn?: 0 | 1;
  /** Called when .ics data is loaded/refreshed so the parent can show per-day events in a detail panel. */
  onIcsEventsChange?: (events: IcsEventView[]) => void;
}

export function StudyCalendar({
  tasks = [],
  onDateSelect,
  selectedDate,
  compact = false,
  weekStartsOn = 0,
  onIcsEventsChange,
}: StudyCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [icsEvents, setIcsEvents] = useState<IcsEventView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const loadCalendar = useCallback(() => {
    startTransition(async () => {
      setLoadError(null);
      const res = await fetch("/api/calendar/ics", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        import?: { events: IcsEventView[] } | null;
        backendDisabled?: boolean;
        message?: string;
      };
      if (!res.ok) {
        setIcsEvents([]);
        if (data.backendDisabled) {
          setLoadError(data.message ?? "Backend storage is off.");
        } else {
          setLoadError(null);
        }
        return;
      }
      setIcsEvents(data.import?.events ?? []);
    });
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    const onMode = () => loadCalendar();
    window.addEventListener("impromptu-app-mode", onMode);
    return () => window.removeEventListener("impromptu-app-mode", onMode);
  }, [loadCalendar]);

  useEffect(() => {
    onIcsEventsChange?.(icsEvents);
  }, [icsEvents, onIcsEventsChange]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const jsFirstDow = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const leadingBlanks = weekStartsOn === 1 ? (jsFirstDow + 6) % 7 : jsFirstDow;

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const taskYmdSet = useMemo(
    () => new Set(tasks.map((task) => normalizeTaskYmd(task.date))),
    [tasks],
  );

  const daysWithIcs = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const set = new Set<number>();
    for (const e of icsEvents) {
      const d = new Date(e.start);
      if (d.getFullYear() === y && d.getMonth() === m) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [icsEvents, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    onDateSelect?.(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    onDateSelect?.(null);
  };

  const handleDateClick = (day: number | null) => {
    if (day === null) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect?.(selectedDate === dateStr ? null : dateStr);
  };

  async function onUploadIcs(file: File) {
    setUploadMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/calendar/ics", { method: "POST", body: fd, credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      count?: number;
      message?: string;
      backendDisabled?: boolean;
      replacedPrevious?: boolean;
    };
    if (!res.ok) {
      setUploadMsg({
        kind: "err",
        text: data.backendDisabled && data.message ? data.message : data.error ?? "Upload failed",
      });
      return;
    }
    setUploadMsg({
      kind: "ok",
      text: formatIcsUploadSuccessMessage(data.count ?? 0, Boolean(data.replacedPrevious)),
    });
    loadCalendar();
    router.refresh();
  }

  const dayLabels =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days: (number | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full">
      <div className={`${compact ? "mb-2 space-y-2" : "mb-4 space-y-3"}`}>
        <IcsUploadButton
          variant="compact"
          disabled={pending}
          label="Upload .ics calendar"
          onFile={onUploadIcs}
        />
        {uploadMsg ? (
          <p className={`text-xs ${uploadMsg.kind === "ok" ? "text-emerald-700" : "text-rose-700"}`}>{uploadMsg.text}</p>
        ) : null}
        {loadError ? <p className="text-xs text-amber-800">{loadError}</p> : null}
      </div>

      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-4"}`}>
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Previous month"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200/90"
        >
          <span className="text-base leading-none" aria-hidden>
            ◀
          </span>
        </button>
        <h3 className="font-semibold text-slate-900" suppressHydrationWarning>
          {monthName}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Next month"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200/90"
        >
          <span className="text-base leading-none" aria-hidden>
            ▶
          </span>
        </button>
      </div>

      <div
        className={`grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600 ${compact ? "mb-1" : "mb-2"}`}
      >
        {dayLabels.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const dateStr = day
            ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null;
          const isSelected = selectedDate === dateStr;
          const hasTask = Boolean(day && dateStr && taskYmdSet.has(dateStr));
          const hasIcs = Boolean(day && daysWithIcs.has(day));

          // Match `/schedule` month grid: blue = days with study/quiz tasks, emerald = .ics only, selected = blue border.
          let cellClass = "";
          if (day !== null) {
            if (isSelected) {
              cellClass =
                "border-2 border-blue-500 bg-blue-50 text-slate-900 hover:bg-blue-100 z-[1]";
            } else if (hasTask) {
              cellClass =
                "border-2 border-blue-300 bg-blue-100 text-slate-900 hover:border-blue-400";
            } else if (hasIcs) {
              cellClass =
                "border-2 border-emerald-300 bg-emerald-50 text-slate-900 hover:border-emerald-400";
            } else {
              cellClass = "border border-slate-200 bg-white text-slate-800 hover:border-slate-300";
            }
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`aspect-square rounded-lg text-sm font-semibold transition-all ${cellClass}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className={`space-y-1.5 ${compact ? "mt-2 text-[11px]" : "mt-4 text-xs"}`}>
        <div className="flex items-center gap-2">
          <div
            className={`shrink-0 rounded-full border-2 border-blue-300 bg-blue-100 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`}
          />
          <span className="text-slate-700">Day with quiz / study tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`shrink-0 rounded-full border-2 border-emerald-300 bg-emerald-50 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`}
          />
          <span className="text-slate-700">Imported .ics only</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`shrink-0 rounded-full border-2 border-blue-500 bg-blue-50 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`}
          />
          <span className="text-slate-700">Selected day</span>
        </div>
      </div>
    </div>
  );
}
