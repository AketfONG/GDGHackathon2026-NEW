import { TopNav } from "@/components/top-nav";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import { uiOnlyQuizzes } from "@/lib/ui-quizzes";

export default function QuizzesPage() {
  const quizzes = uiOnlyQuizzes;
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  let dbOffline = isBackendDisabled();
  let quizzes: Array<{
    id: string;
    title: string;
    topic: string;
    difficulty: string;
    questions: Array<{ id: string; prompt: string; options: unknown }>;
  }> = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();
      const rows = await QuizModel.find({}).sort({ createdAt: -1 }).lean();
      quizzes = rows.map((quiz) => ({
        id: String(quiz._id),
        title: quiz.title,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        questions: (quiz.questions ?? []).map((q: { _id: unknown; prompt: string; options: unknown }) => ({
          id: String(q._id),
          prompt: q.prompt,
          options: q.options,
        })),
      }));
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        dbOffline = true;
      } else {
        throw error;
      }
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Quizzes</h1>
        <p className="rounded border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          UI-only mode is active. Quiz content and submission are mocked locally.
        </p>
        {quizzes.length === 0 ? (
          <p className="rounded border border-slate-200 bg-white p-4 text-slate-600">
            No quizzes available in UI-only mode.
          </p>
        ) : null}
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <section key={quiz.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">{quiz.title}</h2>
                <p className="text-sm text-slate-600">
                  {quiz.topic} · {quiz.difficulty}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Showing up to 10 questions with 4 options each.
                </p>
              </div>
              <QuizAttemptForm quiz={quiz} />
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
