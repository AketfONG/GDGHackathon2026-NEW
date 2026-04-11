"use client";

import { useMemo, useState } from "react";
import { dateToLocalYmd } from "@/lib/calendar-dates";

/** Normalize task.date to YYYY-MM-DD for comparison with calendar cells (full date, not day-of-month only). */
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
  /** Tighter vertical rhythm (e.g. dashboard beside a packed sidebar). */
  compact?: boolean;
  /** 0 = week starts Sunday, 1 = Monday (from Settings). */
  weekStartsOn?: 0 | 1;
}

export function StudyCalendar({
  tasks = [],
  onDateSelect,
  selectedDate,
  compact = false,
  weekStartsOn = 0,
}: StudyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const jsFirstDow = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const leadingBlanks = weekStartsOn === 1 ? (jsFirstDow + 6) % 7 : jsFirstDow;

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const taskYmdSet = useMemo(
    () => new Set(tasks.map((task) => normalizeTaskYmd(task.date))),
    [tasks],
  );

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

  const dayLabels =
    weekStartsOn === 1
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = [];
  for (let i = 0; i < leadingBlanks; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-4"}`}>
        <button
          onClick={handlePrevMonth}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
        >
          ←
        </button>
        <h3 className="font-semibold text-slate-900" suppressHydrationWarning>{monthName}</h3>
        <button
          onClick={handleNextMonth}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
        >
          →
        </button>
      </div>

      <div
        className={`grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600 ${compact ? "mb-1" : "mb-2"}`}
      >
        {dayLabels.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
          const isSelected = selectedDate === dateStr;
          const hasTask = Boolean(day && dateStr && taskYmdSet.has(dateStr));

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`aspect-square rounded text-sm font-semibold transition-all ${
                day === null
                  ? ""
                  : isSelected
                    ? "bg-blue-700 text-white ring-2 ring-blue-400"
                    : hasTask
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className={`space-y-2 text-sm ${compact ? "mt-2" : "mt-4"}`}>
        <div className="flex items-center gap-2">
          <div className={`rounded bg-blue-600 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
          <span className={compact ? "text-xs text-slate-600" : "text-slate-600"}>Study scheduled</span>
        </div>
      </div>
    </div>
  );
}
