"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { useEffect, useState } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useAppDemoMode } from "@/hooks/use-app-demo-mode";

/** Demo-only preset courses (not shown in live mode). */
const MOCK_COURSES = [
  { id: "econ2103", name: "ECON2103" },
  { id: "comp3511", name: "COMP3511" },
  { id: "math2411", name: "MATH2411" },
  { id: "huma2104", name: "HUMA2104" },
  { id: "mark3220", name: "MARK3220" },
];

type UploadedFilesMap = Record<string, Record<string, string[]>>;

const DEMO_WEEK_KEYS = ["1", "2", "3", "4", "5"] as const;

function buildDemoEmptyUploads(): UploadedFilesMap {
  const out: UploadedFilesMap = {};
  for (const c of MOCK_COURSES) {
    out[c.id] = {};
    for (const w of DEMO_WEEK_KEYS) {
      out[c.id][w] = [];
    }
  }
  return out;
}

function slugCourseName(name: string): string {
  const t = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return t.length > 0 ? t : "course";
}

/** Uppercase ASCII letters only so course codes (e.g. COMP3511) stay capital while digits/spaces/punctuation are unchanged. */
function uppercaseCourseLetters(value: string): string {
  return value.replace(/[a-z]/g, (ch) => ch.toUpperCase());
}

function normalizeWeekKeyFromSettings(raw: string | null): number | null {
  if (!raw) return null;
  const m = /^week(\d+)$/i.exec(raw);
  if (m) return parseInt(m[1], 10);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

const getFileIcon = (filename: string) => {
  if (filename.endsWith(".pdf")) return "📄";
  if (filename.endsWith(".txt")) return "📝";
  if (filename.endsWith(".md")) return "📋";
  if (filename.endsWith(".docx") || filename.endsWith(".doc")) return "📑";
  if (filename.endsWith(".pptx") || filename.endsWith(".ppt")) return "📊";
  return "📎";
};

function courseDisplayName(
  courseKey: string,
  isDemo: boolean,
  liveLabels: Record<string, string>,
): string {
  if (isDemo) {
    const c = MOCK_COURSES.find((x) => x.id === courseKey);
    if (c) return c.name;
  }
  return liveLabels[courseKey] ?? courseKey.replace(/-/g, " ");
}

export default function UploadMaterialsPage() {
  const [settings, patchSettings] = useUserSettings();
  const { isDemo, loaded: modeLoaded } = useAppDemoMode();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [liveCourseName, setLiveCourseName] = useState("");
  const [liveCourseLabels, setLiveCourseLabels] = useState<Record<string, string>>({});
  const [weekNum, setWeekNum] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesMap>({});
  const [isDragging, setIsDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!modeLoaded) return;
    if (isDemo) {
      setUploadedFiles(buildDemoEmptyUploads());
      setSelectedCourseId(null);
      setLiveCourseName("");
      setWeekNum(null);
    } else {
      setUploadedFiles({});
      setSelectedCourseId(null);
      setLiveCourseName("");
      setLiveCourseLabels({});
      setWeekNum(null);
    }
  }, [modeLoaded, isDemo]);

  useEffect(() => {
    if (!settings.rememberUploadSelections || !modeLoaded) return;

    if (isDemo) {
      const c = settings.uploadLastCourseId;
      if (c && MOCK_COURSES.some((x) => x.id === c)) {
        setSelectedCourseId(c);
      }
    } else {
      const slug = settings.uploadLastCourseId;
      if (slug && slug.length > 0) {
        setLiveCourseName(uppercaseCourseLetters(slug.replace(/-/g, " ")));
      }
    }

    const wk = normalizeWeekKeyFromSettings(settings.uploadLastWeekId);
    if (wk !== null) setWeekNum(wk);
  }, [settings.rememberUploadSelections, settings.uploadLastCourseId, settings.uploadLastWeekId, isDemo, modeLoaded]);

  const liveCourseKey = slugCourseName(liveCourseName);
  const hasLiveCourse = !isDemo && liveCourseName.trim().length > 0;
  const hasDemoCourse = isDemo && selectedCourseId !== null;
  const selectedDemoCourse = MOCK_COURSES.find((c) => c.id === selectedCourseId);
  const courseKey = isDemo ? selectedCourseId! : liveCourseKey;
  const weekKey = weekNum !== null && weekNum >= 1 ? String(weekNum) : null;
  const canUpload = (hasDemoCourse || hasLiveCourse) && weekKey !== null;

  const resolveCourseNameForApi = (): string | null => {
    if (isDemo && selectedDemoCourse) return selectedDemoCourse.name;
    if (!isDemo && hasLiveCourse) return liveCourseName.trim();
    return null;
  };

  async function runColdGenerationForFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    const courseName = resolveCourseNameForApi();
    if (!courseName || !weekKey) {
      alert(
        isDemo
          ? "Please select a course and enter a week number (1–52)."
          : "Please enter a course name and a week number (1–52).",
      );
      return;
    }

    const ck = courseKey;
    if (!isDemo) {
      setLiveCourseLabels((prev) => ({ ...prev, [ck]: liveCourseName.trim() }));
    }

    setGenerating(true);
    setStatusMessage(null);

    const formData = new FormData();
    for (const file of list) {
      formData.append("file", file);
    }
    formData.append("course", courseName);
    formData.append("week", weekKey);

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

      setUploadedFiles((prev) => {
        const next = { ...prev };
        if (!next[ck]) next[ck] = {};
        if (!next[ck][weekKey]) next[ck][weekKey] = [];
        next[ck] = {
          ...next[ck],
          [weekKey]: [...(next[ck][weekKey] ?? []), ...list.map((f) => f.name)],
        };
        return next;
      });

      if (settings.rememberUploadSelections) {
        if (isDemo && selectedCourseId) {
          patchSettings({ uploadLastCourseId: selectedCourseId, uploadLastWeekId: weekKey });
        }
        if (!isDemo) {
          patchSettings({ uploadLastCourseId: ck, uploadLastWeekId: weekKey });
        }
      }

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

    if (!canUpload || !weekKey) {
      alert(
        isDemo
          ? "Select a course and enter a valid week number first."
          : "Enter a course name and a valid week number first.",
      );
      return;
    }

    const files = e.dataTransfer.files;
    if (files?.length) {
      void runColdGenerationForFiles(files);
    }
  };

  const removeFile = (course: string, week: string, fileIndex: number) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      const wk = { ...(copy[course] ?? {}) };
      const arr = [...(wk[week] ?? [])];
      arr.splice(fileIndex, 1);
      wk[week] = arr;
      copy[course] = wk;
      return copy;
    });
  };

  const uploadHeading =
    isDemo && selectedDemoCourse && weekKey
      ? `${selectedDemoCourse.name} · Week ${weekKey}`
      : !isDemo && hasLiveCourse && weekKey
        ? `${liveCourseName.trim()} · Week ${weekKey}`
        : "";

  const courseKeysWithFiles = Object.keys(uploadedFiles).filter((ck) =>
    Object.values(uploadedFiles[ck] ?? {}).some((files) => files.length > 0),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <section className="mb-8">
          <Link href="/" className="link-arrow-nav mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-semibold text-slate-900">Upload Course Materials</h1>
          <p className="mt-2 text-slate-600">
            Upload a file for the selected course and week. A <strong>cold test</strong> is generated
            automatically from your file(s).
            {!isDemo ? (
              <>
                {" "}
                <strong>Live mode</strong> has no preset course list — enter your course name below.
              </>
            ) : null}
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

        {/* Step 1: Course */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Step 1: Course</h2>
          {isDemo ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {MOCK_COURSES.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    if (settings.rememberUploadSelections) {
                      patchSettings({ uploadLastCourseId: course.id });
                    }
                  }}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    selectedCourseId === course.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{course.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="max-w-md">
              <label htmlFor="live-course" className="mb-1 block text-sm font-medium text-slate-700">
                Course name
              </label>
              <input
                id="live-course"
                type="text"
                value={liveCourseName}
                onChange={(e) => setLiveCourseName(uppercaseCourseLetters(e.target.value))}
                placeholder="e.g. COMP 3511 — Operating Systems"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Step 2: Week number */}
        {(hasDemoCourse || hasLiveCourse) && (
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Step 2: Week number</h2>
            <div className="max-w-xs">
              <label htmlFor="week-num" className="mb-1 block text-sm font-medium text-slate-700">
                Week
              </label>
              <input
                id="week-num"
                type="number"
                min={1}
                max={52}
                step={1}
                value={weekNum === null ? "" : weekNum}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setWeekNum(null);
                    return;
                  }
                  const n = parseInt(v, 10);
                  if (!Number.isNaN(n)) setWeekNum(n);
                }}
                placeholder="e.g. 3"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {canUpload ? (
          <div className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Step 3: Upload materials · {uploadHeading}
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
              {isDemo
                ? "👆 Select a course and enter a week number (1–52) to upload."
                : "👆 Enter a course name and a week number (1–52) to upload."}
            </p>
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Step 4: Your uploaded files</h2>
          {courseKeysWithFiles.length === 0 ? (
            <p className="text-sm text-slate-500">No files yet.</p>
          ) : (
            <div className="space-y-8">
              {courseKeysWithFiles.sort().map((ck) => (
                <div key={ck}>
                  <h3 className="mb-4 text-base font-semibold text-slate-900">
                    {courseDisplayName(ck, isDemo, liveCourseLabels)}
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(uploadedFiles[ck] ?? {})
                      .sort((a, b) => Number(a) - Number(b))
                      .filter((wk) => (uploadedFiles[ck][wk]?.length ?? 0) > 0)
                      .map((wk) => {
                        const weekFiles = uploadedFiles[ck][wk] ?? [];
                        return (
                          <div key={wk} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-900">Week {wk}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {weekFiles.map((file, idx) => (
                                <div
                                  key={`${file}-${idx}`}
                                  className="flex items-center justify-between rounded bg-white p-2 hover:bg-slate-100"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="text-lg">{getFileIcon(file)}</span>
                                    <p className="truncate text-sm font-medium text-slate-900">{file}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(ck, wk, idx)}
                                    className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-4 border-b border-slate-200" />
                </div>
              ))}
            </div>
          )}
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
