import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { getServerUser } from "@/lib/auth/server-user";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";
import { isSharedDemoUser } from "@/lib/quiz-access";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { dateToLocalYmd } from "@/lib/calendar-dates";
import { getScheduledStudyTasks, type ScheduledStudyTask } from "@/lib/scheduled-quizzes";

export function scheduleTaskRowKey(t: ScheduledStudyTask): string {
  return `${t.date}:${t.type}:${t.id}`;
}

export function mergeScheduleTasks(
  a: ScheduledStudyTask[],
  b: ScheduledStudyTask[],
): ScheduledStudyTask[] {
  const map = new Map<string, ScheduledStudyTask>();
  for (const t of a) map.set(scheduleTaskRowKey(t), t);
  for (const t of b) map.set(scheduleTaskRowKey(t), t);
  return Array.from(map.values()).sort(
    (x, y) => x.date.localeCompare(y.date) || x.title.localeCompare(y.title),
  );
}

type PendingHot = { dueDate?: string; sourceAttemptId?: unknown } | null | undefined;

/**
 * Calendar tasks from upload-generated cold quizzes: creation day + pending hot follow-up (+7 days after cold).
 */
export async function loadDynamicScheduleTasks(): Promise<ScheduledStudyTask[]> {
  if (isBackendDisabled()) return [];

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

    if (accessOr.length === 0) return [];

    const rows = await QuizModel.find({
      testType: "cold",
      createdFromUpload: true,
      course: { $exists: true, $nin: ["", null] },
      week: { $exists: true, $nin: ["", null] },
      $or: accessOr,
    })
      .select({ title: 1, course: 1, week: 1, createdAt: 1, pendingHotFollowUp: 1 })
      .sort({ createdAt: -1 })
      .lean();

    const out: ScheduledStudyTask[] = [];

    for (const row of rows) {
      const quiz = row as Record<string, unknown>;
      const qid = String(quiz._id);
      const course = String(quiz.course || "Course");
      const weekNum = parseInt(String(quiz.week), 10);
      const weekLabel = Number.isFinite(weekNum) ? `Week ${weekNum}` : String(quiz.week);
      const topic = `${course} · ${weekLabel}`;
      const titleBase = String(quiz.title || "Cold test");

      const createdAt = quiz.createdAt as Date | string | undefined;
      const created =
        createdAt instanceof Date
          ? createdAt
          : typeof createdAt === "string"
            ? new Date(createdAt)
            : new Date();
      const createdYmd = dateToLocalYmd(created);

      out.push({
        id: qid,
        date: createdYmd,
        title: `${course} — ${titleBase} (uploaded)`,
        type: "cold_quiz",
        topic,
        priority: "medium",
        time: `Added ${new Date(createdYmd + "T12:00:00").toLocaleDateString()}`,
        duration: "45 min",
        description: "Cold test generated from your upload — open from Quizzes to take or retake.",
      });

      const pending = quiz.pendingHotFollowUp as PendingHot;
      const due = pending && typeof pending.dueDate === "string" ? pending.dueDate.trim() : "";
      if (due) {
        out.push({
          id: qid,
          date: due,
          title: `${course} — Hot follow-up`,
          type: "hot_quiz",
          topic: `${topic} · Hot (after cold)`,
          priority: "high",
          time: `Due ${new Date(due + "T12:00:00").toLocaleDateString()}`,
          duration: "45 min",
          description:
            "Scheduled one week after your last cold test completion — retake the same quiz to consolidate.",
        });
      }
    }

    return out;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return [];
    throw error;
  }
}

export async function getMergedScheduleTasksForViewer(): Promise<ScheduledStudyTask[]> {
  const staticTasks = getScheduledStudyTasks();
  const dynamic = await loadDynamicScheduleTasks();
  return mergeScheduleTasks(staticTasks, dynamic);
}
