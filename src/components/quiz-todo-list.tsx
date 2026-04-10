"use client";

import Link from "next/link";

export type ColdTestTodo = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  status?: "not-started" | "in-progress" | "completed";
  scorePercent?: number;
};

function difficultyStyles(difficulty: string) {
  const d = difficulty.toUpperCase();
  if (d === "HARD") return "bg-red-100 text-red-800";
  if (d === "MEDIUM") return "bg-yellow-100 text-yellow-800";
  if (d === "EASY") return "bg-green-100 text-green-800";
  return "bg-slate-100 text-slate-800";
}

export function QuizTodoList({
  quizzes,
  loading,
  loadFailed = false,
  compact = false,
}: {
  quizzes: ColdTestTodo[];
  loading: boolean;
  /** True when the database was unavailable — list may be empty even if you have quizzes. */
  loadFailed?: boolean;
  /** Tighter spacing for dashboard side column. */
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? "py-4" : "py-8"}`}>
        <div className={`text-slate-600 ${compact ? "text-base" : ""}`}>Loading quizzes...</div>
      </div>
    );
  }

  if (loadFailed && (!quizzes || quizzes.length === 0)) {
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-amber-50 text-center ${compact ? "p-3" : "p-6"}`}
      >
        <p className={`text-slate-800 ${compact ? "text-base" : ""}`}>
          Could not load cold tests (database offline or misconfigured).
        </p>
        <p className={`text-slate-600 ${compact ? "mt-1.5 text-sm" : "mt-2 text-sm"}`}>
          Check{" "}
          <code className={`rounded bg-white px-1 ${compact ? "text-sm" : "text-xs"}`}>MONGODB_URI</code>, then
          refresh. Full list:{" "}
          <Link href="/quizzes" className="font-semibold text-blue-600 underline hover:text-blue-700">
            Quizzes
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-slate-50 text-center ${compact ? "p-3" : "p-6"}`}>
        <p className={`text-slate-600 ${compact ? "text-base" : ""}`}>No cold tests yet.</p>
        <p className={`text-slate-500 ${compact ? "mt-1.5 text-sm" : "mt-2 text-sm"}`}>
          Use{" "}
          <Link href="/upload" className="font-semibold text-blue-600 underline hover:text-blue-700">
            Upload Materials
          </Link>{" "}
          to generate a quiz; it will show here and in the <strong>Cold</strong> section on{" "}
          <Link href="/quizzes" className="font-semibold text-blue-600 underline hover:text-blue-700">
            Quizzes
          </Link>
          .
        </p>
      </div>
    );
  }

  const gap = compact ? "space-y-2" : "space-y-3";
  return (
    <div className={gap}>
      {quizzes.map((quiz) => {
        const done = quiz.status === "completed";
        const label = done ? "Open" : "Start";
        return (
          <div
            key={quiz.id}
            className={`flex flex-col rounded-lg border border-slate-200 bg-white sm:flex-row sm:items-center sm:justify-between sm:hover:bg-slate-50 ${
              compact ? "gap-2 p-2.5" : "gap-3 p-4"
            }`}
          >
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold text-slate-900 ${compact ? "text-base leading-snug" : ""}`}>
                {quiz.title}
              </h3>
              <div className={`flex flex-wrap ${compact ? "mt-0.5 gap-1.5" : "mt-1 gap-2"}`}>
                <span
                  className={`inline-block rounded bg-blue-100 font-medium text-blue-800 ${compact ? "px-2 py-0.5 text-xs" : "px-2 py-1 text-xs"}`}
                >
                  {quiz.topic}
                </span>
                <span
                  className={`inline-block rounded font-medium ${difficultyStyles(quiz.difficulty)} ${compact ? "px-2 py-0.5 text-xs" : "px-2 py-1 text-xs"}`}
                >
                  {quiz.difficulty}
                </span>
                {done && quiz.scorePercent !== undefined ? (
                  <span
                    className={`inline-block rounded bg-emerald-100 font-medium text-emerald-800 ${compact ? "px-2 py-0.5 text-xs" : "px-2 py-1 text-xs"}`}
                  >
                    {quiz.scorePercent}%
                  </span>
                ) : null}
              </div>
            </div>
            <Link
              href={`/quizzes/${encodeURIComponent(quiz.id)}`}
              className={`shrink-0 rounded-md bg-blue-600 text-center font-semibold text-white hover:bg-blue-700 sm:ml-2 ${
                compact ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm sm:ml-4"
              }`}
            >
              {label} →
            </Link>
          </div>
        );
      })}
    </div>
  );
}
