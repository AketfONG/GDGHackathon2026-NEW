"use client";

import { useEffect, useState } from "react";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import type { UiQuiz } from "@/lib/ui-quizzes";

interface TailoredReviewProps {
  course: string;
  week: string;
  title: string;
  quizId: string;
}

/**
 * Dynamically loads tailored review questions based on student's weak areas.
 * Falls back to basic quiz if generation fails.
 */
export function TailoredReviewQuiz({ course, week, title, quizId }: TailoredReviewProps) {
  const [quiz, setQuiz] = useState<UiQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  useEffect(() => {
    const loadTailoredQuiz = async () => {
      try {
        const res = await fetch("/api/quizzes/generate-review-tailored", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course,
            week: week || undefined,
            questionCount: 15,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to generate review questions");
        }

        if (data.weakTopics) {
          setWeakTopics(data.weakTopics);
        }

        // Convert MCQuestion array to UiQuiz format
        const questions = data.questions || [];
        const uiQuiz: UiQuiz = {
          id: quizId,
          title,
          topic: data.weakTopics?.join(" · ") || course,
          difficulty: "mixed",
          questions: questions.map((q: any) => ({
            id: q.id || "",
            prompt: q.question || q.prompt,
            options: q.options || [],
            correctIdx: q.correctAnswerIndex ?? 0,
            explanation: q.explanation || "",
          })),
        };

        setQuiz(uiQuiz);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load review questions";
        setError(msg);
        console.error("Tailored review error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTailoredQuiz();
  }, [course, week, quizId, title]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded bg-slate-200"></div>
          <div className="h-4 w-1/4 rounded bg-slate-200"></div>
          <div className="mt-6 h-32 rounded bg-slate-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-900">Could not load review questions</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <p className="mt-2 text-xs text-red-600">
          This might happen if you haven't completed any cold or hot quizzes yet.
          Try completing a quiz first and then return to review.
        </p>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-600">No review questions available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
      <div className="mt-2 flex items-center gap-3">
        <p className="text-sm text-slate-600">{quiz.topic}</p>
        {weakTopics.length > 0 && (
          <p className="text-xs text-purple-600">
            Tailored to: {weakTopics.join(", ")}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {quiz.questions.length} tailored questions based on your weak areas
      </p>
      <div className="mt-6">
        <QuizAttemptForm quiz={quiz} isHotFollowup={false} />
      </div>
    </div>
  );
}
