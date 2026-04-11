import { cookies } from "next/headers";
import { HomeDashboard } from "@/components/home-dashboard";
import { getMergedScheduleTasksForViewer } from "@/lib/dynamic-schedule-loader";
import { loadUploadedColdQuizzes } from "@/lib/uploaded-cold-quizzes-loader";
import type { ColdTestTodo } from "@/components/quiz-todo-list";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";
import { getUpcomingReviewQuizConcepts } from "@/lib/scheduled-quizzes";

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

  const coldTests: ColdTestTodo[] = bundles.map(({ courseQuiz, topicLabel, difficulty }) => ({
    id: courseQuiz.id,
    title: courseQuiz.title,
    topic: topicLabel,
    difficulty,
    status: courseQuiz.status,
    scorePercent: courseQuiz.score,
  }));

  return (
    <HomeDashboard
      coldTests={coldTests}
      coldTestsLoadFailed={dbOffline}
      scheduleTasks={scheduleTasks}
      reviewFocusConcepts={reviewFocusConcepts}
    />
  );
}
