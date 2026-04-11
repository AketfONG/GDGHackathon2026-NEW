"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { UiQuiz, UiQuizQuestion } from "@/lib/ui-quizzes";
import { isDefaultScheduledQuizId } from "@/lib/default-scheduled-quizzes";
import { getAuthHeaders } from "@/lib/auth/client-token";
import { useUserSettings } from "@/hooks/use-user-settings";

const QUESTIONS_PER_QUIZ = 10;

type PreparedQuestion = UiQuizQuestion & {
  /** Maps displayed option index → original index (for server scoring when choices are shuffled). */
  optionPermutation?: number[];
};

function clampIndex(idx: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, idx), len - 1);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function withShuffledOptions(q: UiQuizQuestion): PreparedQuestion {
  const options = (Array.isArray(q.options) ? q.options : []).slice(0, 4);
  if (options.length === 0) {
    return { ...q, optionPermutation: undefined };
  }
  const n = options.length;
  const correctOrig = clampIndex(q.correctIdx, n);
  const order = shuffleArray(Array.from({ length: n }, (_, i) => i));
  const newOptions = order.map((i) => options[i]!);
  const newCorrectIdx = order.indexOf(correctOrig);
  return {
    ...q,
    options: newOptions,
    correctIdx: newCorrectIdx,
    optionPermutation: order,
  };
}

function prepareQuestionList(
  quiz: UiQuiz,
  shuffleOrder: boolean,
  shuffleOptions: boolean,
): PreparedQuestion[] {
  let qs = quiz.questions.slice(0, QUESTIONS_PER_QUIZ).map((q) => ({ ...q }));
  if (shuffleOrder) qs = shuffleArray(qs);
  if (shuffleOptions) qs = qs.map((q) => withShuffledOptions(q));
  return qs;
}

export function QuizAttemptForm({ quiz, isHotFollowup = false, onSubmit }: { quiz: UiQuiz; isHotFollowup?: boolean; onSubmit?: () => void }) {
  const router = useRouter();
  const [settings] = useUserSettings();
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
  const [sessionSeed, setSessionSeed] = useState(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [quiz.id]);

  const visibleQuestions = useMemo(
    () =>
      prepareQuestionList(
        quiz,
        settings.shuffleQuestionOrder,
        settings.shuffleAnswerChoices,
      ),
    [
      quiz,
      quiz.id,
      sessionSeed,
      settings.shuffleQuestionOrder,
      settings.shuffleAnswerChoices,
    ],
  );

  const answeredCount = visibleQuestions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const canSubmit =
    phase === "taking" && visibleQuestions.length > 0 && answeredCount === visibleQuestions.length;

  const afterEachExplanation = settings.explanationTiming === "after_each";

  function toServerSelectedIdx(q: PreparedQuestion, displayIdx: number): number {
    const perm = q.optionPermutation;
    if (!perm || !perm.length) return displayIdx;
    return perm[clampIndex(displayIdx, perm.length)] ?? displayIdx;
  }

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
        onSubmit?.();
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
      selectedIdx: toServerSelectedIdx(q, selectedAnswers[q.id] ?? 0),
      responseMs: 0,
    }));

    try {
      const headers = await getAuthHeaders();
      
      // Detect review quiz mode from ID pattern (e.g., "scheduled-COMP3511-review")
      const isReviewQuiz = /scheduled-.*-review$/i.test(String(quiz.id));
      
      const endpoint = isHotFollowup
        ? `/api/quizzes/${encodeURIComponent(quiz.id)}/attempt?mode=hot-followup`
        : isReviewQuiz
          ? `/api/quizzes/${encodeURIComponent(quiz.id)}/attempt?mode=review`
          : `/api/quizzes/${encodeURIComponent(quiz.id)}/attempt`;
      
      const res = await fetch(endpoint, {
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
      onSubmit?.();
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
        {afterEachExplanation
          ? " After you pick an answer, an explanation appears below that question. Submit when every question is answered."
          : " Choose one answer per question, then submit to see results and explanations."}
      </p>
      {(settings.shuffleQuestionOrder || settings.shuffleAnswerChoices) && (
        <p className="text-xs text-slate-500">
          Shuffling is on (see Settings). Retake draws a new random order.
        </p>
      )}
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
          const showPeek =
            phase === "taking" && afterEachExplanation && selected !== undefined;

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
                    <div className="mt-2 space-y-2">
                      <div className="space-y-1">
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
                      {showPeek ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Explanation
                          </p>
                          <p className="mt-1">{explanation}</p>
                        </div>
                      ) : null}
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
              setSessionSeed((s) => s + 1);
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
