"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { useEffect, useState } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";

const MOCK_COURSES = [
  { id: "econ2103", name: "ECON2103" },
  { id: "comp3511", name: "COMP3511" },
  { id: "math2411", name: "MATH2411" },
  { id: "huma2104", name: "HUMA2104" },
  { id: "mark3220", name: "MARK3220" },
  { id: "temg3950", name: "TEMG3950" },
];

const MOCK_WEEKS = [
  { id: "week1", name: "Week 1" },
  { id: "week2", name: "Week 2" },
  { id: "week3", name: "Week 3" },
  { id: "week4", name: "Week 4" },
  { id: "week5", name: "Week 5" },
];

function buildEmptyUploads(): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  for (const c of MOCK_COURSES) {
    out[c.id] = {};
    for (const w of MOCK_WEEKS) {
      out[c.id][w.id] = [];
    }
  }
  return out;
}

function weekIdToNumber(weekId: string): string {
  const m = /^week(\d+)$/i.exec(weekId);
  return m ? m[1] : weekId.replace(/\D/g, "") || "1";
}

const getFileIcon = (filename: string) => {
  if (filename.endsWith(".pdf")) return "📄";
  if (filename.endsWith(".txt")) return "📝";
  if (filename.endsWith(".md")) return "📋";
  if (filename.endsWith(".docx") || filename.endsWith(".doc")) return "📑";
  if (filename.endsWith(".pptx") || filename.endsWith(".ppt")) return "📊";
  return "📎";
};

export default function UploadMaterialsPage() {
  const [settings, patchSettings] = useUserSettings();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState(buildEmptyUploads);
  const [isDragging, setIsDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const selectedCourseData = MOCK_COURSES.find((c) => c.id === selectedCourse);
  const selectedWeekData = MOCK_WEEKS.find((w) => w.id === selectedWeek);

  useEffect(() => {
    if (!settings.rememberUploadSelections) return;
    const c = settings.uploadLastCourseId;
    const w = settings.uploadLastWeekId;
    if (c && MOCK_COURSES.some((x) => x.id === c)) {
      setSelectedCourse(c);
    }
    if (w && MOCK_WEEKS.some((x) => x.id === w)) {
      setSelectedWeek(w);
    }
  }, [settings.rememberUploadSelections, settings.uploadLastCourseId, settings.uploadLastWeekId]);

  async function runColdGenerationForFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    if (!selectedCourse || !selectedWeek || !selectedCourseData) {
      alert("Please select a course and week first");
      return;
    }

    const weekNum = weekIdToNumber(selectedWeek);
    const courseName = selectedCourseData.name;

    setGenerating(true);
    setStatusMessage(null);

    const formData = new FormData();
    for (const file of list) {
      formData.append("file", file);
    }
    formData.append("course", courseName);
    formData.append("week", weekNum);

    try {
      const res = await fetch("/api/quizzes/upload-generate-cold", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        quiz?: { questionCount?: number; sourceFileCount?: number };
      };
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: "err",
          text: data.error || res.statusText || "Failed to generate cold test",
        });
        return;
      }
      setUploadedFiles((prev) => ({
        ...prev,
        [selectedCourse]: {
          ...prev[selectedCourse],
          [selectedWeek]: [...(prev[selectedCourse][selectedWeek] || []), ...list.map((f) => f.name)],
        },
      }));
      const n = data.quiz?.questionCount ?? 0;
      const k = list.length;
      setStatusMessage({
        type: "ok",
        text:
          k > 1
            ? `One cold test created with ${n} questions, drawn evenly from your ${k} files. Open Quizzes to take it.`
            : `Cold test created with ${n} questions. Open Quizzes to take it.`,
      });
    } catch (e) {
      setStatusMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setGenerating(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (files?.length) {
      void runColdGenerationForFiles(files);
    }
    input.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }
    if (!selectedWeek) {
      alert("Please select a week first");
      return;
    }

    const files = e.dataTransfer.files;
    if (files?.length) {
      void runColdGenerationForFiles(files);
    }
  };

  const removeFile = (course: string, week: string, fileIndex: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [course]: {
        ...prev[course],
        [week]: prev[course][week].filter((_, idx) => idx !== fileIndex),
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <section className="mb-8">
          <Link href="/" className="mb-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-semibold text-slate-900">Upload Course Materials</h1>
          <p className="mt-2 text-slate-600">
            Upload a file for the selected course and week. A <strong>cold test</strong> is generated
            automatically from your file(s).
          </p>
        </section>

        {statusMessage ? (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm ${
              statusMessage.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {statusMessage.text}
            {statusMessage.type === "ok" ? (
              <>
                {" "}
                <Link href="/quizzes" className="font-semibold underline">
                  Go to Quizzes
                </Link>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Step 1: Select Your Course</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_COURSES.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  setSelectedCourse(course.id);
                  if (settings.rememberUploadSelections) {
                    patchSettings({ uploadLastCourseId: course.id });
                  }
                }}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedCourse === course.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-900">{course.name}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedCourse && (
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Step 2: Select Your Week</h2>
            <div className="grid gap-3">
              {MOCK_WEEKS.map((week) => (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => {
                    setSelectedWeek(week.id);
                    if (settings.rememberUploadSelections) {
                      patchSettings({ uploadLastWeekId: week.id });
                    }
                  }}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    selectedWeek === week.id
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{week.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCourse && selectedWeek ? (
          <div className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Step 3: Upload Materials for {selectedCourseData?.name} - {selectedWeekData?.name}
            </h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
              } ${generating ? "pointer-events-none opacity-70" : ""}`}
            >
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Upload Study Materials</h3>
              <p className="mt-2 text-sm text-slate-600">
                Select one or more files at once: we build a single cold test, mixing questions evenly
                across materials (may take a few minutes for multiple files).
              </p>
              <div className="mt-4 flex flex-col items-center justify-center gap-2">
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.pdf,.md,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileUpload}
                  multiple
                  disabled={generating}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {generating ? "Generating cold test…" : "Select Files"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <p className="text-center text-amber-900">
              👆 Please select a course and week to upload materials
            </p>
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Step 4: Your Uploaded Files</h2>
          <div className="space-y-8">
            {MOCK_COURSES.map((course) => (
              <div key={course.id}>
                <h3 className="mb-4 text-base font-semibold text-slate-900">{course.name}</h3>
                <div className="space-y-4">
                  {MOCK_WEEKS.map((week) => {
                    const weekFiles = uploadedFiles[course.id]?.[week.id] ?? [];

                    return (
                      <div key={week.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-slate-900">{week.name}</p>
                        {weekFiles.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {weekFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded bg-white p-2 hover:bg-slate-100"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="text-lg">{getFileIcon(file)}</span>
                                  <p className="truncate text-sm font-medium text-slate-900">{file}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(course.id, week.id, idx)}
                                  className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No files uploaded</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 border-b border-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Supported Formats</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Text & Office</h3>
              <ul className="mt-2 list-inside space-y-1 text-sm text-slate-600">
                <li>• Plain text (.txt)</li>
                <li>• Markdown (.md)</li>
                <li>• Word (.doc, .docx)</li>
                <li>• PowerPoint (.ppt, .pptx)</li>
              </ul>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Documents</h3>
              <ul className="mt-2 list-inside space-y-1 text-sm text-slate-600">
                <li>• PDF (.pdf)</li>
                <li>• Content is summarized for the AI (see server limits)</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
