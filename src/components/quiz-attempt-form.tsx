"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth/client-token";

type QuizQuestion = {
  id: string;
  prompt: string;
  options: unknown;
};

type QuizType = {
  id: string;
  questions: QuizQuestion[];
};

export function QuizAttemptForm({ quiz }: { quiz: QuizType }) {
  const [status, setStatus] = useState<string>("");

  async function submitAttempt(formData: FormData) {
    const startedAt = Date.now();
    const answers = quiz.questions.map((q) => {
      const selectedIdx = Number(formData.get(`q-${q.id}`) ?? 0);
      return {
        questionId: q.id,
        selectedIdx,
        responseMs: 12000,
      };
    });

    const res = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify({
        durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        answers,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("Failed to submit attempt");
      return;
    }
    setStatus(`Submitted. Score: ${Math.round((data.attempt.score ?? 0) * 100)}%`);
  }

  return (
    <form
      action={async (formData) => {
        await submitAttempt(formData);
      }}
      className="space-y-4"
    >
      {quiz.questions.map((q, index) => {
        const options = Array.isArray(q.options) ? q.options : [];
        return (
          <fieldset key={q.id} className="rounded border border-slate-200 p-3">
            <legend className="font-medium">
              Q{index + 1}. {q.prompt}
            </legend>
            <div className="mt-2 space-y-1">
              {options.map((option, idx) => (
                <label key={`${q.id}-${idx}`} className="flex items-center gap-2 text-sm">
                  <input type="radio" name={`q-${q.id}`} value={idx} defaultChecked={idx === 0} />
                  {String(option)}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <button className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
        Submit Attempt
      </button>
      {status ? <p className="text-sm text-slate-700">{status}</p> : null}
    </form>
  );
}
