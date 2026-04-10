"use client";

import { useState } from "react";

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
}

export function StudyCalendar({ tasks = [], onDateSelect, selectedDate }: StudyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  // Get task dates for styling
  const taskDates = new Set(
    tasks.map((task) => {
      const date = new Date(task.date);
      return date.getDate();
    })
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

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
        >
          ←
        </button>
        <h3 className="font-semibold text-slate-900">{monthName}</h3>
        <button
          onClick={handleNextMonth}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
          const isSelected = selectedDate === dateStr;
          const hasTask = day && taskDates.has(day);

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

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-600"></div>
          <span className="text-slate-600">Study scheduled</span>
        </div>
      </div>
    </div>
  );
}
