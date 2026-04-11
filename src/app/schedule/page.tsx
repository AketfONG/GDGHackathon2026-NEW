"use client";

import { TopNav } from "@/components/top-nav";
import type { IcsEventView } from "@/components/dashboard-calendar-quizzes";
import { IcsUploadButton } from "@/components/ics-upload-button";
import {
  getScheduledCourseQuizzes,
  getScheduledStudyTasks,
  taskQuizHref,
  type ScheduledStudyTask,
} from "@/lib/scheduled-quizzes";
import { formatIcsUploadSuccessMessage } from "@/lib/ics-upload-message";
import {
  getScheduleTaskTypeColor as getTypeColor,
  getScheduleTaskTypeLabel as getTypeLabel,
} from "@/lib/schedule-task-palette";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const needsPresetCatalog = tasks.some((t) => t.id.startsWith("scheduled-"));
  const quizById = new Map(
    (needsPresetCatalog ? getScheduledCourseQuizzes() : []).map((q) => [q.id, q]),
  );
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

function formatImportedEventTime(isoStart: string, isoEnd: string) {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  const sk = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const ek = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  if (sk === ek) {
    return `${start.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })} – ${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${start.toLocaleString()} → ${end.toLocaleString()}`;
}

type CalendarImportClient = {
  fileName: string;
  importedAt: string;
  events: IcsEventView[];
};

export default function SchedulePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null);
  const [icsImport, setIcsImport] = useState<CalendarImportClient | null>(null);
  const [icsMsg, setIcsMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [studyPlan, setStudyPlan] = useState<StudyTask[]>([]);

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

  const loadIcs = useCallback(async () => {
    const res = await fetch("/api/calendar/ics", { credentials: "include" });
    if (!res.ok) {
      setIcsImport(null);
      return;
    }
    const data = (await res.json()) as { import: CalendarImportClient | null };
    setIcsImport(data.import ?? null);
  }, []);

  useEffect(() => {
    void loadIcs();
  }, [loadIcs]);

  const icsByDate = useMemo(() => {
    const m: Record<string, IcsEventView[]> = {};
    for (const e of icsImport?.events ?? []) {
      const d = new Date(e.start);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!m[k]) m[k] = [];
      m[k].push(e);
    }
    for (const k of Object.keys(m)) {
      m[k].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }
    return m;
  }, [icsImport]);

  async function uploadIcsFile(file: File) {
    setIcsMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/calendar/ics", { method: "POST", body: fd, credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      count?: number;
      backendDisabled?: boolean;
      message?: string;
      replacedPrevious?: boolean;
    };
    if (!res.ok) {
      const err =
        data.backendDisabled && data.message
          ? data.message
          : data.error ?? "Upload failed (is the database running?)";
      setIcsMsg({ kind: "err", text: err });
      return;
    }
    await loadIcs();
    setIcsMsg({
      kind: "ok",
      text: formatIcsUploadSuccessMessage(data.count ?? 0, Boolean(data.replacedPrevious)),
    });
    router.refresh();
  }

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
  const icsForSelectedDay = selectedDate ? icsByDate[selectedDate] ?? [] : [];
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
            tasks list focus topics tied to each review quiz. Upload an{" "}
            <code className="rounded bg-slate-200 px-1 text-sm">.ics</code> file to overlay your real calendar (classes,
            deadlines) on the same month view.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar - Left */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Imported calendar</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Same storage as the dashboard calendar. In live mode, a new upload overwrites your stored calendar;
                  only the latest file is kept.
                </p>
                <div className="mt-3 max-w-md">
                  <IcsUploadButton variant="compact" label="Upload .ics" onFile={uploadIcsFile} />
                </div>
                {icsMsg ? (
                  <p
                    className={`mt-2 text-sm ${icsMsg.kind === "ok" ? "text-emerald-800" : "text-rose-700"}`}
                    role="status"
                  >
                    {icsMsg.text}
                  </p>
                ) : null}
                {icsImport ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Current: <span className="font-medium text-slate-700">{icsImport.fileName}</span> ·{" "}
                    {new Date(icsImport.importedAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No file uploaded yet, or sign in with an account that has MongoDB enabled.</p>
                )}
              </div>

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

              {/* Calendar Grid — min-w-0 / overflow; vertical chips + pb so two tasks never sit on the bottom border */}
              <div className="grid min-w-0 grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div key={`empty-${idx}`} className="h-24 min-w-0 rounded-lg bg-slate-50" />
                    );
                  }

                  const dateString = getDateString(day);
                  const dayTasks = tasksByDate[dateString];
                  const hasTasks = Boolean(dayTasks && dayTasks.length > 0);
                  const icsForDay = icsByDate[dateString] ?? [];
                  const hasIcs = icsForDay.length > 0;
                  const isSelected = selectedDate === dateString;
                  const taskCount = dayTasks?.length || 0;

                  const cellBorder =
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : hasTasks
                        ? "border-blue-300 bg-blue-100 hover:border-blue-400"
                        : hasIcs
                          ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400"
                          : "border-slate-200 bg-white hover:border-slate-300";

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedDate(isSelected ? null : dateString);
                        setSelectedTask(null);
                      }}
                      className={`flex h-24 min-w-0 flex-col items-stretch overflow-hidden rounded-lg border-2 px-1.5 pb-2 pt-1.5 text-left transition-all ${cellBorder}`}
                    >
                      <p className="shrink-0 font-semibold leading-none text-slate-900">{day}</p>
                      {(hasTasks || hasIcs) && (
                        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                          {hasTasks ? (
                            <>
                              <p className="shrink-0 truncate text-[11px] font-medium leading-tight text-blue-700">
                                {taskCount} task{taskCount !== 1 ? "s" : ""}
                              </p>
                              <div className="flex min-h-0 min-w-0 shrink flex-col gap-0.5">
                                {dayTasks!.slice(0, 2).map((task) => {
                                  const colors = getTypeColor(task.type);
                                  return (
                                    <span
                                      key={task.id}
                                      title={getTypeLabel(task.type)}
                                      className={`block w-full min-w-0 truncate rounded px-1 py-0.5 text-center text-[10px] font-medium leading-tight ${colors.bg} ${colors.text}`}
                                    >
                                      {getTypeLabel(task.type).split(" ")[0]}
                                    </span>
                                  );
                                })}
                              </div>
                            </>
                          ) : null}
                          {hasIcs ? (
                            <p className="shrink-0 truncate text-[11px] font-medium leading-tight text-emerald-800">
                              {icsForDay.length} cal event{icsForDay.length !== 1 ? "s" : ""}
                            </p>
                          ) : null}
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

                  {selectedDate && icsForSelectedDay.length > 0 ? (
                    <div className="mb-4 space-y-2">
                      <h3 className="text-sm font-semibold text-emerald-900">Imported calendar</h3>
                      <ul className="space-y-2">
                        {icsForSelectedDay.map((e) => (
                          <li
                            key={e.uid}
                            className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-slate-900">{e.title}</p>
                            <p className="text-xs text-slate-600">
                              {formatImportedEventTime(e.start, e.end)}
                              {e.location ? ` · ${e.location}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

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
                  ) : null}

                  {selectedDate && selectedTasks.length === 0 && icsForSelectedDay.length === 0 ? (
                    <p className="text-center text-slate-500">No tasks or calendar events</p>
                  ) : null}

                  {!selectedDate ? (
                    <p className="text-center text-slate-400">Click on a date to see tasks and imported events</p>
                  ) : null}

                  {/* Legend */}
                  <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold text-slate-600">LEGEND</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
                        <span className="text-xs text-slate-600">Imported .ics (calendar)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-red-100" />
                        <span className="text-xs text-slate-600">Hot Quiz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-blue-100" />
                        <span className="text-xs text-slate-600">Cold Quiz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-100" />
                        <span className="text-xs text-slate-600">Review Quiz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-purple-100" />
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
