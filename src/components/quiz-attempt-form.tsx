"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UiQuiz } from "@/lib/ui-quizzes";
import { isDefaultScheduledQuizId } from "@/lib/default-scheduled-quizzes";
import { getAuthHeaders } from "@/lib/auth/client-token";

const QUESTIONS_PER_QUIZ = 10;

function clampIndex(idx: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, idx), len - 1);
}

export function QuizAttemptForm({ quiz }: { quiz: UiQuiz }) {
  const router = useRouter();
  const startedAtRef = useRef<number>(Date.now());
  const [phase, setPhase] = useState<"taking" | "results">("taking");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scoreSummary, setScoreSummary] = useState<{
    correct: number;
    total: number;
    percent: number;
  } | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [quiz.id]);

  const visibleQuestions = quiz.questions.slice(0, QUESTIONS_PER_QUIZ);
  const answeredCount = visibleQuestions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const canSubmit =
    phase === "taking" && visibleQuestions.length > 0 && answeredCount === visibleQuestions.length;

  async function submitAttempt() {
    setIsSubmitting(true);
    setSubmitError(null);

    if (isDefaultScheduledQuizId(quiz.id)) {
      try {
        const correct = visibleQuestions.reduce((acc, q) => {
          const selected = selectedAnswers[q.id];
          return acc + (selected === q.correctIdx ? 1 : 0);
        }, 0);
        const total = visibleQuestions.length;
        const percent = Math.round((correct / Math.max(1, total)) * 100);
        setScoreSummary({ correct, total, percent });
        setPhase("results");
        router.refresh();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const durationSec = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    );
    const answers = visibleQuestions.map((q) => ({
      questionId: q.id,
      selectedIdx: selectedAnswers[q.id] ?? 0,
      responseMs: 0,
    }));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/quizzes/${encodeURIComponent(quiz.id)}/attempt`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ durationSec, answers }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        attempt?: {
          score: number;
          questionAttempts?: { isCorrect: boolean }[];
        };
      };
      if (!res.ok) {
        setSubmitError(data.error || res.statusText || "Could not save your attempt");
        setIsSubmitting(false);
        return;
      }
      const att = data.attempt;
      if (att?.questionAttempts?.length) {
        const correct = att.questionAttempts.filter((x) => x.isCorrect).length;
        const total = att.questionAttempts.length;
        const percent = Math.round(Number(att.score) * 100);
        setScoreSummary({ correct, total, percent });
      } else {
        const correct = visibleQuestions.reduce((acc, q) => {
          const selected = selectedAnswers[q.id];
          return acc + (selected === q.correctIdx ? 1 : 0);
        }, 0);
        const total = visibleQuestions.length;
        const percent = Math.round((correct / Math.max(1, total)) * 100);
        setScoreSummary({ correct, total, percent });
      }
      setPhase("results");
      router.refresh();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {QUESTIONS_PER_QUIZ} questions per quiz (or fewer if this quiz is shorter), four choices each.
        Choose one answer per question, then submit to see results and explanations.
      </p>
      {phase === "taking" ? (
        <p className="text-sm text-slate-700">
          Progress: {answeredCount}/{visibleQuestions.length} answered
        </p>
      ) : null}

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {submitError}
        </div>
      ) : null}

      {phase === "results" && scoreSummary ? (
        <div
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          role="status"
        >
          <p className="text-lg font-semibold text-slate-900">Quiz complete</p>
          <p className="mt-1 text-slate-700">
            You got <span className="font-semibold text-slate-900">{scoreSummary.correct}</span> out of{" "}
            <span className="font-semibold text-slate-900">{scoreSummary.total}</span> correct (
            <span className="font-semibold text-slate-900">{scoreSummary.percent}%</span>).
          </p>
        </div>
      ) : null}

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (phase !== "taking") return;
          await submitAttempt();
        }}
        className="space-y-4"
      >
        {visibleQuestions.map((q, index) => {
          const options = (Array.isArray(q.options) ? q.options : []).slice(0, 4);
          const safeCorrectIdx = clampIndex(q.correctIdx, options.length);
          const selected = selectedAnswers[q.id];
          const userCorrect =
            phase === "results" && selected !== undefined && selected === q.correctIdx;
          const userWrong = phase === "results" && selected !== undefined && selected !== q.correctIdx;
          const explanation =
            (q.explanation && String(q.explanation).trim()) || "No explanation provided for this question.";

          return (
            <fieldset
              key={q.id}
              className={`rounded-lg border p-4 ${
                phase === "results"
                  ? userCorrect
                    ? "border-emerald-300 bg-emerald-50/60"
                    : userWrong
                      ? "border-red-300 bg-red-50/60"
                      : "border-amber-300 bg-amber-50/50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <legend className="font-medium text-slate-900">
                    Q{index + 1}. {q.prompt}
                  </legend>

                  {phase === "results" ? (
                    <div className="mt-2 space-y-2">
                      <p
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          selected === undefined
                            ? "bg-amber-100 text-amber-900"
                            : userCorrect
                              ? "bg-emerald-200 text-emerald-900"
                              : "bg-red-200 text-red-900"
                        }`}
                      >
                        {selected === undefined
                          ? "Not answered"
                          : userCorrect
                            ? "Correct"
                            : "Incorrect"}
                      </p>
                      <div className="text-sm text-slate-700">
                        <p>
                          <span className="font-medium text-slate-800">Your answer: </span>
                          {selected !== undefined && options[selected] !== undefined
                            ? String(options[selected])
                            : "—"}
                        </p>
                        {userWrong || selected === undefined ? (
                          <p className="mt-1">
                            <span className="font-medium text-slate-800">Correct answer: </span>
                            {options[safeCorrectIdx] !== undefined
                              ? String(options[safeCorrectIdx])
                              : "—"}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Explanation
                        </p>
                        <p className="mt-1">{explanation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {options.map((option, idx) => (
                        <label
                          key={`${q.id}-${idx}`}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={idx}
                            checked={selectedAnswers[q.id] === idx}
                            onChange={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: idx,
                              }))
                            }
                          />
                          {String(option)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {q.media ? (
                  <figure className="w-full shrink-0 md:w-44">
                    <img
                      src={q.media.src}
                      alt={q.media.alt}
                      className="h-auto w-full rounded border border-slate-200 bg-slate-50"
                    />
                    <figcaption className="mt-1 text-xs text-slate-500">{q.media.kind}</figcaption>
                  </figure>
                ) : null}
              </div>
            </fieldset>
          );
        })}

        {phase === "taking" ? (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit & see results"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPhase("taking");
              setSelectedAnswers({});
              setScoreSummary(null);
            }}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Retake quiz
          </button>
        )}
      </form>
    </div>
  );
}
