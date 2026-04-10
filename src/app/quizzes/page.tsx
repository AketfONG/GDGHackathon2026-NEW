import { db } from "@/lib/db";
import { TopNav } from "@/components/top-nav";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  let dbOffline = isBackendDisabled();
  let quizzes: Awaited<ReturnType<typeof db.quiz.findMany>> = [];

  if (!dbOffline) {
    try {
    quizzes = await db.quiz.findMany({
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });
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
        {dbOffline ? <DbOfflineNotice /> : null}
        {!dbOffline && quizzes.length === 0 ? (
          <p className="rounded border border-slate-200 bg-white p-4 text-slate-600">
            No quizzes yet. Click Initialize Demo Data on Home.
          </p>
        ) : null}
        {!dbOffline ? (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <section key={quiz.id} className="rounded-lg border border-slate-200 bg-white p-4">
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
        ) : null}
      </main>
    </div>
  );
}
