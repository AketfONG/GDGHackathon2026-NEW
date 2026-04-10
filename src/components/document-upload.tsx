"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COURSES = [
  { id: "bio101", name: "Biology 101" },
  { id: "chem201", name: "Chemistry Advanced" },
  { id: "econ2103", name: "ECON2103" },
  { id: "math301", name: "Calculus I" },
];

const WEEKS = [
  { id: "1", name: "Week 1" },
  { id: "2", name: "Week 2" },
  { id: "3", name: "Week 3" },
  { id: "4", name: "Week 4" },
  { id: "5", name: "Week 5" },
];

interface GeneratedMCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export function DocumentUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("econ2103");
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [loading, setLoading] = useState(false);
  const [savingToQuizzes, setSavingToQuizzes] = useState(false);
  const [questions, setQuestions] = useState<GeneratedMCQ[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [documentInfo, setDocumentInfo] = useState<{ title: string; fileName: string } | null>(null);
  const [qwenConfigured, setQwenConfigured] = useState<boolean | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Check if Qwen API is configured
    fetch("/api/config/check-qwen")
      .then((res) => res.json())
      .then((data) => setQwenConfigured(data.qwenConfigured))
      .catch(() => setQwenConfigured(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];

      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a PDF, Word, or PowerPoint file");
        setFile(null);
        return;
      }

      // Validate file size (50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!selectedCourse) {
      setError("Please select a course");
      return;
    }
    if (!selectedWeek) {
      setError("Please select a week");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("topic", topic || selectedCourse);
      formData.append("course", selectedCourse);
      formData.append("week", selectedWeek);

      const response = await fetch("/api/quizzes/generate-from-document", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to generate MCQs");
        return;
      }

      setQuestions(data.questions || []);
      setDocumentInfo(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToQuizzes = async () => {
    setSavingToQuizzes(true);
    try {
      const response = await fetch("/api/quizzes/save-from-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: selectedCourse,
          week: selectedWeek,
          questions: questions,
          testType: "cold",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSavedSuccess(true);
        setQuestions([]);
        setFile(null);
        setTopic("");
        setTimeout(() => setSavedSuccess(false), 5000);
      } else {
        setError(data.error || "Failed to save quizzes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quizzes");
    } finally {
      setSavingToQuizzes(false);
    }
  };

  if (questions.length > 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Generated MCQs</h2>
          {documentInfo && (
            <p className="mt-2 text-sm text-slate-600">
              From: <span className="font-medium">{documentInfo.fileName}</span> ({documentInfo.title})
            </p>
          )}
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600">Question {idx + 1}</p>
                  <p className="mt-1 font-medium text-slate-900">{q.question}</p>
                </div>
                <div className="ml-2 flex flex-col gap-1 text-right">
                  <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                    (q.difficulty || "medium") === "easy"
                      ? "bg-green-100 text-green-800"
                      : (q.difficulty || "medium") === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}>
                    {(q.difficulty || "medium").charAt(0).toUpperCase() + (q.difficulty || "medium").slice(1)}
                  </span>
                  <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{q.topic || "General"}</span>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                {q.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className={`rounded-lg border p-2 text-sm ${
                      optIdx === q.correctAnswerIndex
                        ? "border-green-300 bg-green-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{String.fromCharCode(65 + optIdx)}.</span>
                      <p className={`flex-1 ${optIdx === q.correctAnswerIndex ? "font-semibold text-green-800" : "text-slate-700"}`}>
                        {option}
                      </p>
                      {optIdx === q.correctAnswerIndex && <span className="text-green-600">✓ Correct</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">Explanation:</p>
                <p className="mt-1 text-sm text-blue-800">{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setQuestions([]);
              setSavedSuccess(false);
            }}
            className="rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Generate More Questions
          </button>
          <button
            onClick={handleSaveToQuizzes}
            disabled={savingToQuizzes}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-slate-300"
          >
            {savingToQuizzes ? "Saving..." : "Save to Quizzes"}
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              ✓ Quiz saved successfully! Go to the Quizzes tab to start the test.
            </p>
            <Link
              href="/quizzes"
              className="mt-2 inline-block rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Go to Quizzes →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Generate MCQs from Course Materials</h2>
      <p className="mb-6 text-slate-600">
        Upload your course slides, lecture notes, or textbook chapters. Our AI will analyze the content to generate 10 tailored multiple-choice questions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Course Selection */}
        <div>
          <label htmlFor="course" className="mb-2 block text-sm font-semibold text-slate-900">
            Select Course
          </label>
          <select
            id="course"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
          >
            {COURSES.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Week Selection */}
        <div>
          <label htmlFor="week" className="mb-2 block text-sm font-semibold text-slate-900">
            Select Week
          </label>
          <select
            id="week"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
          >
            {WEEKS.map((week) => (
              <option key={week.id} value={week.id}>
                {week.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="mb-2 block text-sm font-semibold text-slate-900">
            Upload Document
          </label>
          <input
            type="file"
            id="file"
            accept=".pdf,.ppt,.pptx,.docx,.doc"
            onChange={handleFileChange}
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />
          <p className="mt-2 text-xs text-slate-500">
            Supported formats: PDF, PowerPoint, Word (Max 50MB)
          </p>
        </div>

        {file && <p className="text-sm font-medium text-green-700">✓ {file.name} selected</p>}

        {/* Topic (Optional) */}
        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-semibold text-slate-900">
            Topic (Optional)
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Microeconomics, Supply & Demand"
            className="block w-full rounded-lg border border-slate-300 p-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <button
          type="submit"
          disabled={!file || loading || !selectedCourse || !selectedWeek}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          {loading ? "Generating Questions... (This may take 1-2 minutes)" : "Generate 10 MCQs"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="mb-3 font-semibold text-slate-900">How it works:</h3>
        <ol className="space-y-2 text-sm text-slate-600">
          <li>
            <span className="font-semibold text-slate-900">1. Select course & week</span>
          </li>
          <li>
            <span className="font-semibold text-slate-900">2. Upload</span> - Submit your course materials
          </li>
          <li>
            <span className="font-semibold text-slate-900">3. Generate</span> - AI creates 10 MCQs
          </li>
          <li>
            <span className="font-semibold text-slate-900">4. Save</span> - Click "Save to Quizzes" to store them
          </li>
          <li>
            <span className="font-semibold text-slate-900">5. Take Quiz</span> - Go to Quizzes tab to start and score
          </li>
        </ol>
      </div>

      {qwenConfigured === false && (
        <div className="mt-6 rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ Setup Required:</span> This feature requires a Qwen API key. See the{" "}
            <code className="rounded bg-amber-100 px-1 font-mono">AI_MCQ_SETUP.md</code> file in the project root for setup instructions.
          </p>
        </div>
      )}

      {qwenConfigured === true && (
        <div className="mt-6 rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">
            <span className="font-semibold">✓ Ready:</span> Qwen API is configured and ready to generate MCQs!
          </p>
        </div>
      )}
    </div>
  );
}
