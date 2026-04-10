"use client";

import { useState } from "react";

export function StudyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock study dates for demo
  const MOCK_STUDY_DATES = new Set([5, 8, 12, 15, 19, 22, 26, 29]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
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
        {days.map((day, index) => (
          <div
            key={index}
            className={`aspect-square rounded text-sm font-semibold ${
              day === null
                ? ""
                : MOCK_STUDY_DATES.has(day)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            }`}
          >
            {day}
          </div>
        ))}
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
