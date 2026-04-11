import { cookies } from "next/headers";
import { HomeDashboard } from "@/components/home-dashboard";
import { getMergedScheduleTasksForViewer } from "@/lib/dynamic-schedule-loader";
import { loadUploadedColdQuizzes } from "@/lib/uploaded-cold-quizzes-loader";
import type { ColdTestTodo } from "@/components/quiz-todo-list";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";
import { getScheduledCourseQuizzes, getUpcomingReviewQuizConcepts } from "@/lib/scheduled-quizzes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const initialAppMode = getDemoModeFromCookieStore(cookieStore);
  const presets = isPresetDemoContentEnabled(initialAppMode);
  const reviewFocusConcepts = presets ? getUpcomingReviewQuizConcepts() : [];

  const [{ bundles, dbOffline }, scheduleTasks] = await Promise.all([
    loadUploadedColdQuizzes(),
    getMergedScheduleTasksForViewer(),
  ]);

  const uploadedColdTests: ColdTestTodo[] = bundles.map(({ courseQuiz, topicLabel, difficulty }) => ({
    id: courseQuiz.id,
    title: courseQuiz.title,
    topic: topicLabel,
    difficulty,
    status: courseQuiz.status,
    scorePercent: courseQuiz.score,
  }));

  const presetColdTests: ColdTestTodo[] = presets
    ? getScheduledCourseQuizzes()
        .filter((q) => q.testType === "cold")
        .map((q) => ({
          id: q.id,
          title: q.title,
          topic: q.subtopic ? `${q.course} · ${q.subtopic}` : q.course,
          difficulty: "MIXED",
          status: q.status,
          scorePercent: q.score,
        }))
    : [];

  const coldTests = [...presetColdTests, ...uploadedColdTests];
  const coldTestsLoadFailed = dbOffline && coldTests.length === 0;

  return (
    <HomeDashboard
      coldTests={coldTests}
      coldTestsLoadFailed={coldTestsLoadFailed}
      scheduleTasks={scheduleTasks}
      reviewFocusConcepts={reviewFocusConcepts}
    />
  );
}
