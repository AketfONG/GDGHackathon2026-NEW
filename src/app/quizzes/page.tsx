import { TopNav } from "@/components/top-nav";
import { QuizList, type CourseQuiz } from "@/components/quiz-list";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { getServerUser } from "@/lib/auth/server-user";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";
import { isSharedDemoUser } from "@/lib/quiz-access";
import { getScheduledCourseQuizzes } from "@/lib/scheduled-quizzes";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  let dbOffline = isBackendDisabled();
  let dbOfflineDetail: string | undefined;
  let coldQuizzes: CourseQuiz[] = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();

      const cookieStore = await cookies();
      const scope = cookieStore.get(QUIZ_CLIENT_SCOPE_COOKIE)?.value?.trim() ?? null;
      const user = await getServerUser();

      const viewerIsDemo = isSharedDemoUser(
        user as { email?: string | null; firebaseUid?: string | null } | null,
      );
      const accessOr: Record<string, unknown>[] = [];
      if (user?._id && !viewerIsDemo) accessOr.push({ ownerUserId: user._id });
      if (scope) accessOr.push({ quizClientScope: scope });

      let rows: unknown[] = [];
      if (accessOr.length > 0) {
        rows = await QuizModel.find({
          testType: "cold",
          createdFromUpload: true,
          course: { $exists: true, $nin: ["", null] },
          week: { $exists: true, $nin: ["", null] },
          $or: accessOr,
        })
          .sort({ createdAt: -1 })
          .lean();
      }
      const quizIds = rows.map((q) => (q as { _id: unknown })._id);

      const latestByQuizId = new Map<
        string,
        { score: number; questionAttempts: { isCorrect: boolean }[] }
      >();

      if (user?._id && quizIds.length > 0) {
        const attempts = await QuizAttemptModel.find({
          userId: user._id,
          quizId: { $in: quizIds },
        })
          .sort({ submittedAt: -1 })
          .lean();

        for (const att of attempts) {
          const qid = String(att.quizId);
          if (!latestByQuizId.has(qid)) {
            latestByQuizId.set(qid, {
              score: Number(att.score) || 0,
              questionAttempts: (att.questionAttempts ?? []) as { isCorrect: boolean }[],
            });
          }
        }
      }

      coldQuizzes = rows
        .filter((quiz: any) => String(quiz.course ?? "").trim() && String(quiz.week ?? "").trim())
        .map((quiz: any) => {
          const qid = String(quiz._id);
          const latest = latestByQuizId.get(qid);
          const totalQ = quiz.questions?.length || 0;
          if (!latest) {
            return {
              id: qid,
              course: quiz.course || "Unknown",
              week: parseInt(quiz.week) || undefined,
              testType: "cold" as const,
              title: quiz.title || "Quiz",
              status: "not-started" as const,
              totalQuestions: totalQ,
            };
          }
          const correctAnswers = latest.questionAttempts.filter((x) => x.isCorrect).length;
          const graded = latest.questionAttempts.length || 1;
          return {
            id: qid,
            course: quiz.course || "Unknown",
            week: parseInt(quiz.week) || undefined,
            testType: "cold" as const,
            title: quiz.title || "Quiz",
            status: "completed" as const,
            totalQuestions: graded,
            correctAnswers,
            score: Math.round(latest.score * 100),
          };
        });

      const scheduled = getScheduledCourseQuizzes();
      coldQuizzes = [...scheduled, ...coldQuizzes];
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
