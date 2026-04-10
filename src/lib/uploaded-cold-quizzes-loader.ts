import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { getServerUser } from "@/lib/auth/server-user";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";
import { isSharedDemoUser } from "@/lib/quiz-access";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import type { CourseQuiz } from "@/components/quiz-list";

export type UploadedColdQuizBundle = {
  courseQuiz: CourseQuiz;
  /** e.g. "PHYS · Week 4" for compact lists */
  topicLabel: string;
  difficulty: string;
};

/**
 * Upload-generated cold quizzes visible to the current viewer (same query as /quizzes Cold section).
 * Does not include scheduled hot/review placeholders.
 */
export async function loadUploadedColdQuizzes(): Promise<{
  bundles: UploadedColdQuizBundle[];
  dbOffline: boolean;
  dbOfflineDetail?: string;
}> {
  if (isBackendDisabled()) {
    return { bundles: [], dbOffline: true };
  }

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

    const bundles: UploadedColdQuizBundle[] = rows
      .filter((quiz: { course?: unknown; week?: unknown }) => {
        return String(quiz.course ?? "").trim() && String(quiz.week ?? "").trim();
      })
      .map((quiz: Record<string, unknown>) => {
        const qid = String(quiz._id);
        const latest = latestByQuizId.get(qid);
        const totalQ = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
        const course = String(quiz.course || "Unknown");
        const weekNum = parseInt(String(quiz.week), 10);
        const week = Number.isFinite(weekNum) ? weekNum : undefined;
        const difficulty = String(quiz.difficulty ?? "MIXED").toUpperCase();
        const topicLabel = week !== undefined ? `${course} · Week ${week}` : course;

        let courseQuiz: CourseQuiz;
        if (!latest) {
          courseQuiz = {
            id: qid,
            course,
            week,
            testType: "cold",
            title: String(quiz.title || "Quiz"),
            status: "not-started",
            totalQuestions: totalQ,
          };
        } else {
          const correctAnswers = latest.questionAttempts.filter((x) => x.isCorrect).length;
          const graded = latest.questionAttempts.length || 1;
          courseQuiz = {
            id: qid,
            course,
            week,
            testType: "cold",
            title: String(quiz.title || "Quiz"),
            status: "completed",
            totalQuestions: graded,
            correctAnswers,
            score: Math.round(latest.score * 100),
          };
        }

        return { courseQuiz, topicLabel, difficulty };
      });

    return { bundles, dbOffline: false };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        bundles: [],
        dbOffline: true,
        dbOfflineDetail: error instanceof Error ? error.message : undefined,
      };
    }
    throw error;
  }
}
