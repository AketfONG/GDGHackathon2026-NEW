import { TopNav } from "@/components/top-nav";
import { QuizList, type CourseQuiz } from "@/components/quiz-list";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  let dbOffline = isBackendDisabled();
  let dbOfflineDetail: string | undefined;
  let coldQuizzes: CourseQuiz[] = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();

      // Only rows created by upload-generate-cold / save-from-upload (cold). Stale DB docs without this flag stay hidden.
      const rows = await QuizModel.find({
        testType: "cold",
        createdFromUpload: true,
        course: { $exists: true, $nin: ["", null] },
        week: { $exists: true, $nin: ["", null] },
      })
        .sort({ createdAt: -1 })
        .lean();

      coldQuizzes = rows
        .filter((quiz: any) => String(quiz.course ?? "").trim() && String(quiz.week ?? "").trim())
        .map((quiz: any) => ({
          id: String(quiz._id),
          course: quiz.course || "Unknown",
          week: parseInt(quiz.week) || undefined,
          testType: "cold" as const,
          title: quiz.title || "Quiz",
          status: "not-started" as const,
          totalQuestions: quiz.questions?.length || 0,
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
            Cold tests built from materials you upload appear here—nothing is shown until you generate one.
          </p>
        </div>

        {!dbOffline && coldQuizzes.length > 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="font-semibold text-blue-900">Cold test</div>
            <p className="mt-1 text-sm text-blue-800">
              These quizzes were generated from files you uploaded for the listed course and week.
            </p>
          </div>
        ) : null}

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
        ) : (
          <QuizList quizzes={coldQuizzes} />
        )}
      </main>
    </div>
  );
}
