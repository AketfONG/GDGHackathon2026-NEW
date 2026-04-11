import { cookies } from "next/headers";
import { TopNav } from "@/components/top-nav";
import { QuizList, type CourseQuiz } from "@/components/quiz-list";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { getScheduledCourseQuizzes } from "@/lib/scheduled-quizzes";
import { loadUploadedColdQuizzes } from "@/lib/uploaded-cold-quizzes-loader";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";
import { loadDynamicScheduleTasks, loadHotFollowupAttempts } from "@/lib/dynamic-schedule-loader";
import { isMongoObjectIdString } from "@/lib/mongo-object-id";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const cookieStore = await cookies();
  const presets = isPresetDemoContentEnabled(getDemoModeFromCookieStore(cookieStore));

  let dbOffline = isBackendDisabled();
  let dbOfflineDetail: string | undefined;
  let coldQuizzes: CourseQuiz[] = [];

  if (!dbOffline) {
    const { bundles, dbOffline: loadOffline, dbOfflineDetail: loadDetail } =
      await loadUploadedColdQuizzes();
    if (loadOffline) {
      dbOffline = true;
      dbOfflineDetail = loadDetail;
      if (presets) {
        coldQuizzes = getScheduledCourseQuizzes();
      }
    } else {
      const uploaded = bundles.map((b) => b.courseQuiz);
      const scheduled = presets ? getScheduledCourseQuizzes() : [];
      const dynamicTasks = await loadDynamicScheduleTasks();
      const hotAttempts = await loadHotFollowupAttempts();

      // Convert dynamic tasks to CourseQuiz format for hot follow-ups
      const dynamicHot: CourseQuiz[] = dynamicTasks
        .filter((t) => t.type === "hot_quiz")
        .map((t) => {
          const attempt = hotAttempts.get(t.id);
          const correctAnswers = attempt
            ? attempt.questionAttempts.filter((x) => x.isCorrect).length
            : 0;
          const graded = attempt ? attempt.questionAttempts.length || 1 : 0;

          return {
            id: t.id,
            course: t.topic?.split(" · ")[0] || "",
            subtopic: t.topic?.split(" · ").slice(1).join(" · ") || "",
            testType: "hot" as const,
            title: t.title,
            status: attempt ? ("completed" as const) : ("not-started" as const),
            dueDate: t.date,
            externalHref: t.externalQuizHref,
            ...(attempt && {
              score: Math.round(attempt.score * 100),
              totalQuestions: graded,
              correctAnswers,
            }),
          };
        });

      coldQuizzes = [...scheduled, ...uploaded, ...dynamicHot];
    }
  } else if (presets) {
    coldQuizzes = getScheduledCourseQuizzes();
  }

  const quizzesUnavailable = dbOffline && coldQuizzes.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Quizzes</h1>
          <p className="mt-2 text-slate-600">
            Upcoming hot and review quizzes for select courses are listed below. Cold tests from your uploads appear
            here too once you generate them.
          </p>
        </div>

        {!quizzesUnavailable &&
        coldQuizzes.some((q) => isMongoObjectIdString(q.id)) ? (
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <div className="font-semibold text-slate-900">Saved quizzes</div>
            <p className="mt-1 text-sm text-slate-600">
              Upload-generated cold tests and completed hot follow-ups share the same saved quiz. Use{" "}
              <span className="font-semibold">Delete quiz</span> on a card after you have taken the quiz to remove it
              and clear attempts (cannot be undone).
            </p>
          </div>
        ) : null}

        {quizzesUnavailable ? (
          <div className="mb-8 space-y-3">
            <DbOfflineNotice detail={dbOfflineDetail} />
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-lg text-slate-600">
                Quizzes are unavailable while the database is offline.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Fix <code className="rounded bg-slate-200 px-1 text-xs">MONGODB_URI</code>, then refresh.
              </p>
            </div>
          </div>
        ) : (
          <>
            {dbOffline ? <DbOfflineNotice detail={dbOfflineDetail} /> : null}
            <QuizList quizzes={coldQuizzes} />
          </>
        )}
      </main>
    </div>
  );
}
