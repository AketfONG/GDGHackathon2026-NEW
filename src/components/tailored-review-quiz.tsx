"use client";

import { useEffect, useState } from "react";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import type { UiQuiz } from "@/lib/ui-quizzes";

interface TailoredReviewProps {
  course: string;
  week?: string;
  title: string;
  quizId: string;
}

/**
 * Dynamically loads tailored review questions based on student's weak areas
 * from their uploaded cold quiz for this course.
 * Falls back to basic quiz if generation fails.
 */
export function TailoredReviewQuiz({ course, week, title, quizId }: TailoredReviewProps) {
  const [quiz, setQuiz] = useState<UiQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [unclearConcepts, setUnclearConcepts] = useState<string[]>([]);
  const [postSubmissionConcepts, setPostSubmissionConcepts] = useState<string[]>([]);
  const [sourceTitle, setSourceTitle] = useState<string>("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [recalculatingConcepts, setRecalculatingConcepts] = useState(false);

  const handleQuizSubmit = async () => {
    console.log("[handleQuizSubmit] Quiz submitted, calling recap API...");
    setQuizSubmitted(true);
    
    // Recalculate unclear concepts including this review attempt
    setRecalculatingConcepts(true);
    try {
      const reqBody = {
        course,
        week: week || undefined,
      };
      console.log("[handleQuizSubmit] Sending recap request:", reqBody);
      const res = await fetch("/api/quizzes/recap-unclear-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      console.log("[handleQuizSubmit] Recap API response:", data);
      if (data.unclearConcepts) {
        console.log("[handleQuizSubmit] Updating post-submission concepts from", postSubmissionConcepts, "to", data.unclearConcepts);
        setPostSubmissionConcepts(data.unclearConcepts);
      }
    } catch (err) {
      console.error("[handleQuizSubmit] Error recalculating concepts:", err);
      console.error("Error recalculating concepts:", err);
    } finally {
      setRecalculatingConcepts(false);
    }
  };

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

        if (data.unclearConcepts) {
          setUnclearConcepts(data.unclearConcepts);
          // Also set them for post-submission display
          setPostSubmissionConcepts(data.unclearConcepts);
        }

        if (data.sourceQuizTitle) {
          setSourceTitle(data.sourceQuizTitle);
        }

        // Convert MCQuestion array to UiQuiz format
        const questions = data.questions || [];
        console.log(`[TailoredReviewQuiz] Received ${questions.length} generated questions`);
        if (questions.length > 0) {
          console.log(`[TailoredReviewQuiz] First question:`, questions[0].question.substring(0, 80));
        }
        const weekStr = week ? ` - Week ${week}` : "";
        const displayTitle = `${course}${weekStr}: Review Test`;

        const uiQuiz: UiQuiz = {
          id: quizId,
          title: displayTitle,
          topic: "mixed",
          difficulty: "mixed",
          questions: questions.map((q: any, idx: number) => ({
            id: q.id || `review-q-${idx}`,
            prompt: q.question || q.prompt,
            options: q.options || [],
            correctIdx: q.correctAnswerIndex ?? 0,
            explanation: q.explanation || "",
          })),
        };
        console.log(`[TailoredReviewQuiz] Created quiz with ${uiQuiz.questions.length} questions`);

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
    <div className="space-y-6">
      {/* Quiz Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
        <p className="mt-1 text-sm text-slate-600">Review Test</p>
        <p className="mt-3 text-sm text-slate-500">
          {quiz.questions.length} questions · mixed difficulty
        </p>
        <div className="mt-6">
          <QuizAttemptForm quiz={quiz} isHotFollowup={false} onSubmit={handleQuizSubmit} />
        </div>
      </div>

      {/* Post-Quiz: Summary of Unclear Concepts */}
      {quizSubmitted && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-900">Unclear Concepts You Should Focus On</h2>
          
          {recalculatingConcepts ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
              <p className="text-sm text-blue-700">Analyzing your results...</p>
            </div>
          ) : postSubmissionConcepts.length > 0 ? (
            <>
              <p className="mt-3 text-sm text-blue-700">
                Based on your quiz attempts (cold, hot, and this review), here are the concepts you're still struggling with:
              </p>
              <ul className="mt-4 space-y-3">
                {postSubmissionConcepts.map((concept, idx) => (
                  <li key={`${concept}-${idx}`} className="flex items-start gap-3 text-sm text-blue-800">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-300 font-bold text-white flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-blue-200 pt-4">
                <p className="text-sm text-blue-700">
                  Study and strengthen your understanding of these concepts. Try this review quiz again in a few days to track your progress.
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-blue-700">
              Great job! No unclear concepts detected. Continue practicing to maintain your progress.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
