import { HomeDashboard } from "@/components/home-dashboard";
import { loadUploadedColdQuizzes } from "@/lib/uploaded-cold-quizzes-loader";
import type { ColdTestTodo } from "@/components/quiz-todo-list";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { bundles, dbOffline } = await loadUploadedColdQuizzes();

  const coldTests: ColdTestTodo[] = bundles.map(({ courseQuiz, topicLabel, difficulty }) => ({
    id: courseQuiz.id,
    title: courseQuiz.title,
    topic: topicLabel,
    difficulty,
    status: courseQuiz.status,
    scorePercent: courseQuiz.score,
  }));

  return <HomeDashboard coldTests={coldTests} coldTestsLoadFailed={dbOffline} />;
}
