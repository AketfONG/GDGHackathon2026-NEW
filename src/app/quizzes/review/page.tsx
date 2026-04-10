"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { getUiQuizById, uiOnlyQuizzes } from "@/lib/ui-quizzes";

type StoredReview = {
  quizId: string;
  selectedAnswers: Record<string, number>;
  submittedAt: number;
};

export default function QuizReviewPage() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId") ?? uiOnlyQuizzes[0]?.id;
  const quiz = quizId ? getUiQuizById(quizId) : undefined;

  const stored = useMemo<StoredReview | null>(() => {
    if (!quizId || typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(`quiz-review:${quizId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredReview;
    } catch {
      return null;
    }
  }, [quizId]);

  if (!quiz) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="rounded border border-slate-200 bg-white p-4 text-slate-700">
            Quiz not found.
          </p>
        </main>
      </div>
    );
  }

  const visibleQuestions = quiz.questions.slice(0, 10);
  const selectedAnswers = stored?.selectedAnswers ?? {};

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Quiz Review</h1>
        <p className="text-sm text-slate-600">
          {quiz.title} · {quiz.topic} · {quiz.difficulty}
        </p>
        {!stored ? (
          <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            No completed attempt found for this quiz yet. Complete a quiz first to view selected answers.
          </p>
        ) : null}
        <div className="space-y-4">
          {visibleQuestions.map((question, index) => {
            const selectedIdx = selectedAnswers[question.id];
            const isCorrect = selectedIdx === question.correctIdx;
            const selectedText =
              selectedIdx === undefined ? "No answer selected" : question.options[selectedIdx] ?? "Invalid answer";
            const correctText = question.options[question.correctIdx] ?? "Unknown";
            return (
              <section key={question.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">
                      Q{index + 1}. {question.prompt}
                    </h2>
                    <p className="mt-2 text-sm text-slate-700">
                      Your answer:{" "}
                      <span className={isCorrect ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
                        {selectedText}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Correct answer: <span className="font-medium text-slate-900">{correctText}</span>
                    </p>
                    <p className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
                      Explanation: {question.explanation}
                    </p>
                  </div>
                  {question.media ? (
                    <figure className="w-full shrink-0 md:w-44">
                      <img
                        src={question.media.src}
                        alt={question.media.alt}
                        className="h-auto w-full rounded border border-slate-200 bg-slate-50"
                      />
                      <figcaption className="mt-1 text-xs text-slate-500">{question.media.kind}</figcaption>
                    </figure>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
        <div>
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
