"use client";

import { TopNav } from "@/components/top-nav";
import {
  getScheduledCourseQuizzes,
  getScheduledStudyTasks,
  taskQuizHref,
  type ScheduledStudyTask,
} from "@/lib/scheduled-quizzes";
import Link from "next/link";
import { useEffect, useState } from "react";

interface StudyTask {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "hot_quiz" | "cold_quiz" | "review_quiz" | "study_topic";
  topic: string;
  priority: "high" | "medium" | "low";
  time: string;
  duration: string;
  description: string;
  externalQuizHref?: string;
  // Additional details for task info panel
  contents?: string[];
  unclearConcepts?: string[];
  topicsCovered?: string[];
  studyTips?: string[];
}

function enrichTasksWithReviewConcepts(tasks: ScheduledStudyTask[]): StudyTask[] {
  const quizById = new Map(getScheduledCourseQuizzes().map((q) => [q.id, q]));
  return tasks.map((t) => {
    const cq = quizById.get(t.id);
    if (t.type === "review_quiz" && cq?.testType === "review") {
      const topic = String(cq.subtopic ?? "").trim();
      if (topic) return { ...t, unclearConcepts: [topic] };
    }
    return { ...t };
  });
}

function canOpenQuizTask(t: StudyTask): boolean {
  return (
    Boolean(t.externalQuizHref) ||
    t.id.startsWith("scheduled-") ||
    /^[a-f\d]{24}$/i.test(t.id)
  );
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "hot_quiz":
      return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
    case "cold_quiz":
      return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" };
    case "review_quiz":
      return { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" };
    case "study_topic":
      return { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" };
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "hot_quiz":
      return "Hot Quiz";
    case "cold_quiz":
      return "Cold Quiz";
    case "review_quiz":
      return "Review Quiz";
    case "study_topic":
      return "Study";
    default:
      return "Task";
  }
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null);

  const [studyPlan, setStudyPlan] = useState<StudyTask[]>(() =>
    enrichTasksWithReviewConcepts(getScheduledStudyTasks()),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/schedule/tasks", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { tasks?: ScheduledStudyTask[] };
        if (cancelled || !Array.isArray(data.tasks)) return;
        setStudyPlan(enrichTasksWithReviewConcepts(data.tasks));
      } catch {
        /* keep static plan */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group tasks by date
  const tasksByDate = studyPlan.reduce(
    (acc, task) => {
      if (!acc[task.date]) {
        acc[task.date] = [];
      }
      acc[task.date].push(task);
      return acc;
    },
    {} as Record<string, StudyTask[]>
  );

  // Create calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSelectedTask(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setSelectedTask(null);
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Study Schedule</h1>
          <p className="mt-2 text-slate-600">
            Click a date to view tasks for that day. Hot and review quizzes for several courses are pre-filled; review
            tasks list focus topics tied to each review quiz.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar - Left */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              {/* Month Navigation */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="mb-2 grid grid-cols-7 gap-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="rounded-lg bg-slate-200 py-2 text-center text-sm font-semibold text-slate-900"
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div key={`empty-${idx}`} className="h-24 rounded-lg bg-slate-50" />
                    );
                  }

                  const dateString = getDateString(day);
                  const hasTasks = tasksByDate[dateString] && tasksByDate[dateString].length > 0;
                  const isSelected = selectedDate === dateString;
                  const taskCount = tasksByDate[dateString]?.length || 0;

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDate(isSelected ? null : dateString);
                        setSelectedTask(null);
                      }}
                      className={`h-24 rounded-lg border-2 p-2 text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : hasTasks
                            ? "border-blue-300 bg-blue-100 hover:border-blue-400"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{day}</p>
                      {hasTasks && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs font-medium text-blue-700">{taskCount} task{taskCount !== 1 ? "s" : ""}</p>
                          <div className="flex flex-wrap gap-1">
                            {tasksByDate[dateString].slice(0, 2).map((task) => {
                              const colors = getTypeColor(task.type);
                              return (
                                <span
                                  key={`${task.date}-${task.type}-${task.id}`}
                                  className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                                >
                                  {getTypeLabel(task.type).split(" ")[0]}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task Details - Right */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-slate-200 bg-white p-6 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {selectedTask ? (
                // Detailed Task View
                <>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    ← Back to tasks
                  </button>
                  <div className={`rounded-lg border-2 p-4 ${getTypeColor(selectedTask.type).bg}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-semibold ${getTypeColor(selectedTask.type).text}`}>
                          {getTypeLabel(selectedTask.type)}
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-900">{selectedTask.title}</p>
                        <p className="mt-2 text-sm text-slate-700">{selectedTask.description}</p>
                      </div>
                    </div>

                    {/* Task Info */}
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <span className="inline-block rounded bg-slate-200 px-3 py-1 text-sm font-medium text-slate-800">
                          {selectedTask.topic}
                        </span>
                        <span className={`inline-block rounded px-3 py-1 text-sm font-medium ${
                          selectedTask.priority === "high"
                            ? "bg-red-200 text-red-800"
                            : selectedTask.priority === "medium"
                              ? "bg-amber-200 text-amber-800"
                              : "bg-green-200 text-green-800"
                        }`}>
                          {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                        </span>
                      </div>

                      <div className="flex gap-4 text-sm text-slate-600">
                        <span>⏰ {selectedTask.time}</span>
                        <span>⌛ {selectedTask.duration}</span>
                      </div>
                    </div>

                    {/* Topics/Concepts - Only for quizzes */}
                    {selectedTask.topicsCovered && (
                      <div className="mt-4 rounded-lg bg-white p-3">
                        <p className="font-semibold text-slate-900">Topics Covered</p>
                        <ul className="mt-2 space-y-1">
                          {selectedTask.topicsCovered.map((topic, idx) => (
                            <li key={idx} className="text-sm text-slate-700">
                              • {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Unclear Concepts - For cold/review quiz and study */}
                    {selectedTask.unclearConcepts && selectedTask.unclearConcepts.length > 0 && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3 border border-blue-200">
                        <p className="font-semibold text-blue-900">Concepts Needing Review</p>
                        <ul className="mt-2 space-y-1">
                          {selectedTask.unclearConcepts.map((concept, idx) => (
                            <li key={idx} className="text-sm text-blue-800">
                              • {concept}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contents/Preview - For study and cold quiz */}
                    {selectedTask.contents && selectedTask.contents.length > 0 && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-300">
                        <p className="font-semibold text-slate-900">Contents & Preview</p>
                        <ul className="mt-2 space-y-1">
                          {selectedTask.contents.map((content, idx) => (
                            <li key={idx} className="text-sm text-slate-700">
                              • {content}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Do Quiz Button */}
                    {(selectedTask.type === "hot_quiz" || selectedTask.type === "cold_quiz" || selectedTask.type === "review_quiz") &&
                      (canOpenQuizTask(selectedTask) ? (
                        <Link
                          href={taskQuizHref(selectedTask as ScheduledStudyTask)}
                          className="mt-4 block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Open quiz
                        </Link>
                      ) : (
                        <button className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors">
                          Start {getTypeLabel(selectedTask.type)}
                        </button>
                      ))}

                    {/* Study Tips */}
                    {selectedTask.type === "study_topic" && (
                      <div className="mt-4 rounded-lg bg-purple-50 p-4 border border-purple-200">
                        <p className="font-semibold text-purple-900">How to Study {selectedTask.title.split(": ")[1]}</p>
                        {selectedTask.studyTips && selectedTask.studyTips.length > 0 ? (
                          <ul className="mt-3 space-y-2 text-sm text-purple-800">
                            {selectedTask.studyTips.map((tip, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="font-bold">{idx + 1}.</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="mt-3 space-y-2 text-sm text-purple-800">
                            <li className="flex gap-2">
                              <span className="font-bold">1.</span>
                              <span>Review the concepts listed above to understand key points</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold">2.</span>
                              <span>Use your uploaded materials and lecture notes to study in depth</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold">3.</span>
                              <span>Practice with related quiz questions after understanding the concepts</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold">4.</span>
                              <span>Take notes on areas that are still unclear for further review</span>
                            </li>
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Task List or Empty State
                <>
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    {selectedDate ? (
                      <>
                        {new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </>
                    ) : (
                      "Select a date"
                    )}
                  </h2>

                  {selectedDate && selectedTasks.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTasks.map((task) => {
                        const colors = getTypeColor(task.type);
                        return (
                          <button
                            key={`${task.date}-${task.type}-${task.id}`}
                            onClick={() => setSelectedTask(task)}
                            className={`w-full rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${colors.bg} border-slate-300`}
                          >
                            <p className={`font-semibold text-sm ${colors.text}`}>
                              {getTypeLabel(task.type)}
                            </p>
                            <p className="mt-1 font-medium text-slate-900">{task.title}</p>
                            <p className="mt-1 text-xs text-slate-700">{task.description}</p>

                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="inline-block rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
                                {task.topic}
                              </span>
                              <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                task.priority === "high"
                                  ? "bg-red-200 text-red-800"
                                  : task.priority === "medium"
                                    ? "bg-amber-200 text-amber-800"
                                    : "bg-green-200 text-green-800"
                              }`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            </div>

                            <div className="mt-2 flex gap-2 text-xs text-slate-600">
                              <span>{task.time}</span>
                              <span>•</span>
                              <span>{task.duration}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : selectedDate && selectedTasks.length === 0 ? (
                    <p className="text-center text-slate-500">No tasks scheduled</p>
                  ) : (
                    <p className="text-center text-slate-400">Click on a date to see tasks</p>
                  )}

                  {/* Legend */}
                  <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold text-slate-600">TASK TYPES</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-red-100"></div>
                        <span className="text-xs text-slate-600">Hot Quiz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-blue-100"></div>
                        <span className="text-xs text-slate-600">Cold Quiz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-100"></div>
                        <span className="text-xs text-slate-600">Review Quiz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-purple-100"></div>
                        <span className="text-xs text-slate-600">Study</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
