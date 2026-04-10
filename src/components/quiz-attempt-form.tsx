"use client";

import { useState } from "react";
import { UiQuiz } from "@/lib/ui-quizzes";

export function QuizAttemptForm({ quiz }: { quiz: UiQuiz }) {
  const [status, setStatus] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleQuestions = quiz.questions.slice(0, 10);
  const answeredCount = visibleQuestions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const canSubmit = visibleQuestions.length > 0 && answeredCount === visibleQuestions.length;

  async function submitAttempt() {
    setIsSubmitting(true);
    setStatus("");
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Prototype mode: local-only completion feedback.
    const correct = visibleQuestions.reduce((acc, q) => {
      const selected = selectedAnswers[q.id];
      return acc + (selected === q.correctIdx ? 1 : 0);
    }, 0);
    const score = Math.round((correct / Math.max(1, visibleQuestions.length)) * 100);
    setStatus(`Completed. Local score: ${score}%`);
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await submitAttempt();
      }}
      className="space-y-4"
    >
      <p className="text-sm text-slate-600">
        10 questions per quiz, 4 choices each. Choose exactly one answer per question.
      </p>
      <p className="text-sm text-slate-700">
        Progress: {answeredCount}/{visibleQuestions.length} answered
      </p>
      {visibleQuestions.map((q, index) => {
        const options = (Array.isArray(q.options) ? q.options : []).slice(0, 4);
        return (
          <fieldset key={q.id} className="rounded border border-slate-200 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <legend className="font-medium">
                  Q{index + 1}. {q.prompt}
                </legend>
                <div className="mt-2 space-y-1">
                  {options.map((option, idx) => (
                    <label key={`${q.id}-${idx}`} className="flex items-center gap-2 text-sm">
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
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Completing..." : "Complete Quiz"}
      </button>
      {status ? <p className="text-sm text-slate-700">{status}</p> : null}
    </form>
  );
}
