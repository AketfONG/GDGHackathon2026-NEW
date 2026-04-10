import { TopNav } from "@/components/top-nav";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import { QuizList, type CourseQuiz } from "@/components/quiz-list";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { UiQuiz } from "@/lib/ui-quizzes";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  let dbOffline = isBackendDisabled();
  let dbOfflineDetail: string | undefined;
  let generatedQuizzes: CourseQuiz[] = [];
  let legacyQuizzes: UiQuiz[] = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();
      
      // Fetch all quizzes
      const rows = await QuizModel.find({}).sort({ createdAt: -1 }).lean();
      
      // Convert to CourseQuiz format for display
      generatedQuizzes = rows
        .filter((quiz: any) => quiz.course && quiz.week && quiz.testType)
        .map((quiz: any) => ({
          id: String(quiz._id),
          course: quiz.course || "Unknown",
          week: parseInt(quiz.week) || undefined,
          testType: (quiz.testType || "review") as "cold" | "hot" | "review",
          title: quiz.title || "Quiz",
          status: "not-started" as const,
          totalQuestions: quiz.questions?.length || 0,
        }));

      // Also keep legacy quizzes for backward compatibility
      legacyQuizzes = rows
        .filter((quiz: any) => !quiz.testType)
        .map((quiz) => ({
          id: String(quiz._id),
          title: quiz.title,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          questions: (quiz.questions ?? []).map((q: { _id: unknown; prompt: string; options: unknown }) => ({
            id: String(q._id),
            prompt: q.prompt,
            options: (Array.isArray(q.options) ? q.options : []).map((option) => String(option)),
            correctIdx: Number((q as { correctIdx?: number }).correctIdx ?? 0),
            explanation: String((q as { explanation?: string }).explanation ?? "No explanation provided."),
          })),
        }));
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        dbOffline = true;
        if (error instanceof Error && error.message) {
          dbOfflineDetail = error.message;
        }
      } else {
        throw error;
      }
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quizzes</h1>
          <p className="mt-2 text-slate-600">
            Take cold, hot, and review tests to master each course
          </p>
        </div>

        {/* Test Types Legend */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div className="font-semibold text-blue-900">💧 Cold Test</div>
            <p className="mt-1 text-sm text-blue-800">
              Baseline test at the start of the week to assess current knowledge
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="font-semibold text-red-900">🔥 Hot Test</div>
            <p className="mt-1 text-sm text-red-800">
              Same quiz as cold test, taken one week later to measure improvement
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
            <div className="font-semibold text-purple-900">📚 Review Test</div>
            <p className="mt-1 text-sm text-purple-800">
              Unlimited practice on unclear concepts and challenging topics
            </p>
          </div>
        </div>

        {dbOffline ? (
          <div className="mb-8 space-y-3">
            <DbOfflineNotice detail={dbOfflineDetail} />
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-lg text-slate-600">
                Quizzes are unavailable while the database is offline.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Fix <code className="rounded bg-slate-200 px-1 text-xs">MONGODB_URI</code>, then refresh.
              </p>
            </div>
          </div>
        ) : generatedQuizzes.length > 0 ? (
          <QuizList quizzes={generatedQuizzes} />
        ) : legacyQuizzes.length > 0 ? (
          <>
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Available Tests
              </h2>
              <div className="space-y-4">
                {legacyQuizzes.map((quiz) => (
                  <section
                    key={quiz.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-3">
                      <h2 className="text-lg font-semibold">{quiz.title}</h2>
                      <p className="text-sm text-slate-600">
                        {quiz.topic} · {quiz.difficulty}
                      </p>
                    </div>
                    <QuizAttemptForm quiz={quiz} />
                  </section>
                ))}
              </div>
            </div>
          </>
        ) : (
          <QuizList quizzes={[]} />
        )}
      </main>
    </div>
  );
}
