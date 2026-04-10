"use client";

import Link from "next/link";

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
}

export function QuizTodoList({ quizzes, loading }: { quizzes: Quiz[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-600">Loading quizzes...</div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">No cold tests yet.</p>
        <p className="mt-2 text-sm text-slate-500">
          Use{" "}
          <Link href="/upload" className="font-semibold text-blue-600 underline hover:text-blue-700">
            Upload Materials
          </Link>{" "}
          to generate a quiz; it will show here and on the Quizzes page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
            <div className="mt-1 flex gap-2">
              <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {quiz.topic}
              </span>
              <span
                className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                  quiz.difficulty === "HARD"
                    ? "bg-red-100 text-red-800"
                    : quiz.difficulty === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                {quiz.difficulty}
              </span>
            </div>
          </div>
          <Link
            href={`/quizzes/${quiz.id}/attempt`}
            className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start →
          </Link>
        </div>
      ))}
    </div>
  );
}
