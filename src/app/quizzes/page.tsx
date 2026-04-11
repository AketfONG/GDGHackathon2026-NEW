import { cookies } from "next/headers";
import { TopNav } from "@/components/top-nav";
import { QuizList, type CourseQuiz } from "@/components/quiz-list";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { getScheduledCourseQuizzes } from "@/lib/scheduled-quizzes";
import { loadUploadedColdQuizzes } from "@/lib/uploaded-cold-quizzes-loader";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  let dbOffline = isBackendDisabled();
  let dbOfflineDetail: string | undefined;
  let coldQuizzes: CourseQuiz[] = [];

  if (!dbOffline) {
    const { bundles, dbOffline: loadOffline, dbOfflineDetail: loadDetail } =
      await loadUploadedColdQuizzes();
    if (loadOffline) {
      dbOffline = true;
      dbOfflineDetail = loadDetail;
    } else {
      const cookieStore = await cookies();
      const presets = isPresetDemoContentEnabled(getDemoModeFromCookieStore(cookieStore));
      const uploaded = bundles.map((b) => b.courseQuiz);
      const scheduled = presets ? getScheduledCourseQuizzes() : [];
      coldQuizzes = [...scheduled, ...uploaded];
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quizzes</h1>
          <p className="mt-2 text-slate-600">
            Upcoming hot and review quizzes for select courses are listed below. Cold tests from your uploads appear
            here too once you generate them.
          </p>
        </div>

        {!dbOffline && coldQuizzes.some((q) => q.testType === "cold") ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="font-semibold text-blue-900">Cold test</div>
            <p className="mt-1 text-sm text-blue-800">
              These quizzes were generated from files you uploaded for the listed course and week. Use{" "}
              <span className="font-semibold">Delete quiz</span> on a card to remove it and clear saved attempts for
              that quiz (cannot be undone).
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
