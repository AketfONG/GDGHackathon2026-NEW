"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { FileUploadSection } from "@/components/file-upload-section";
import { useState } from "react";

// Mock courses data
const MOCK_COURSES = [
  { id: "bio101", name: "Biology 101" },
  { id: "chem201", name: "Chemistry Advanced" },
  { id: "math301", name: "Calculus I" },
  { id: "phys101", name: "Physics Mechanics" },
];

// Mock weeks
const MOCK_WEEKS = [
  { id: "week1", name: "Week 1" },
  { id: "week2", name: "Week 2" },
  { id: "week3", name: "Week 3" },
  { id: "week4", name: "Week 4" },
  { id: "week5", name: "Week 5" },
];

// Mock file types with icons
const getFileIcon = (filename: string) => {
  if (filename.endsWith(".pdf")) return "📄";
  if (filename.endsWith(".txt")) return "📝";
  if (filename.endsWith(".md")) return "📋";
  if (filename.endsWith(".docx")) return "📑";
  return "📎";
};

// Mock uploaded files organized by course and week
const MOCK_UPLOADED_FILES = {
  bio101: {
    week1: ["Introduction-to-Biology.pdf", "Chapter1-Notes.md"],
    week2: ["Cell-Structure.pdf"],
    week3: [],
    week4: [],
    week5: [],
  },
  chem201: {
    week1: ["Periodic-Table.pdf"],
    week2: ["Reactions-101.txt", "Bonding-Concepts.docx"],
    week3: [],
    week4: [],
    week5: [],
  },
  math301: {
    week1: ["Calculus-Introduction.pdf"],
    week2: [],
    week3: ["Derivatives-Notes.pdf"],
    week4: [],
    week5: ["Integration-Examples.docx"],
  },
  phys101: {
    week1: ["Forces-Diagram.pdf"],
    week2: [],
    week3: [],
    week4: [],
    week5: [],
  },
};

export default function UploadMaterialsPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState(MOCK_UPLOADED_FILES);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }
    if (!selectedWeek) {
      alert("Please select a week first");
      return;
    }

    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map((f) => f.name);
      setUploadedFiles((prev) => ({
        ...prev,
        [selectedCourse]: {
          ...prev[selectedCourse as keyof typeof prev],
          [selectedWeek]: [
            ...(prev[selectedCourse as keyof typeof prev][selectedWeek as keyof typeof prev[keyof typeof prev]] ||
              []),
            ...newFiles,
          ],
        },
      }));
    }
  };

  const selectedCourseData = MOCK_COURSES.find((c) => c.id === selectedCourse);
  const selectedWeekData = MOCK_WEEKS.find((w) => w.id === selectedWeek);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        {/* Header */}
        <section className="mb-8">
          <Link href="/" className="mb-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-semibold text-slate-900">Upload Course Materials</h1>
          <p className="mt-2 text-slate-600">
            Select a course and week, then upload your study materials.
          </p>
        </section>

        {/* Course Selection */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Step 1: Select Your Course</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_COURSES.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
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

        {/* Week Selection */}
        {selectedCourse && (
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Step 2: Select Your Week</h2>
            <div className="grid gap-3">
              {MOCK_WEEKS.map((week) => (
                <button
                  key={week.id}
                  onClick={() => setSelectedWeek(week.id)}
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

        {/* File Upload Section */}
        {selectedCourse && selectedWeek ? (
          <div className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Step 3: Upload Materials for {selectedCourseData?.name} - {selectedWeekData?.name}
            </h2>
            <div
              className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-100"
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
                Drag and drop your files here, or click to select
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.pdf,.md,.docx"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Select Files
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

        {/* Uploaded Files by Course and Week */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Step 4: Your Uploaded Files</h2>
          <div className="space-y-8">
            {MOCK_COURSES.map((course) => (
              <div key={course.id}>
                <h3 className="mb-4 text-base font-semibold text-slate-900">{course.name}</h3>
                <div className="space-y-4">
                  {MOCK_WEEKS.map((week) => {
                    const weekFiles =
                      uploadedFiles[course.id as keyof typeof uploadedFiles][
                        week.id as keyof typeof uploadedFiles[keyof typeof uploadedFiles]
                      ] || [];

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
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getFileIcon(file)}</span>
                                  <p className="truncate text-sm font-medium text-slate-900">{file}</p>
                                </div>
                                <button className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
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

        {/* Supported Formats */}
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Supported Formats</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Text Formats</h3>
              <ul className="mt-2 list-inside space-y-1 text-sm text-slate-600">
                <li>• Plain text (.txt)</li>
                <li>• Markdown (.md)</li>
                <li>• Word documents (.docx)</li>
              </ul>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Document Formats</h3>
              <ul className="mt-2 list-inside space-y-1 text-sm text-slate-600">
                <li>• PDF files (.pdf)</li>
                <li>• Large documents supported</li>
                <li>• Automatic extraction</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
