import { connectToDatabase } from "@/lib/mongodb";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { QuizModel } from "@/models/Quiz";
import { Types } from "mongoose";

export interface WeakTopicStat {
  topic: string;
  wrongCount: number;
  totalAttempts: number;
  accuracy: number; // 0-1
}

/**
 * Analyzes student's quiz attempts to identify weak topics.
 * Only looks at cold and hot attempts (not review quizzes).
 * Filters by course and week if provided.
 *
 * Returns topics sorted by weakest first (lowest accuracy).
 */
export async function analyzeWeakTopics(
  userId: Types.ObjectId | string,
  options?: {
    course?: string;
    week?: string;
    limit?: number; // max attempts to analyze
  }
): Promise<WeakTopicStat[]> {
  await connectToDatabase();

  const userObjId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
  const limit = options?.limit ?? 10;

  // Fetch recent quiz attempts
  const attempts = await QuizAttemptModel.find({
    userId: userObjId,
    mode: { $in: ["cold", "hot-followup"] }, // Only cold and hot, not review
  })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .lean();

  if (attempts.length === 0) {
    return [];
  }

  const quizIds = attempts.map((a) => a.quizId);

  // Fetch quiz metadata (to get course/week and question topics)
  const quizzes = await QuizModel.find({ _id: { $in: quizIds } }).lean();

  // Filter by course/week if provided
  let relevantQuizzes = quizzes;
  if (options?.course || options?.week) {
    relevantQuizzes = quizzes.filter((q) => {
      const matchCourse = !options.course || q.course === options.course;
      const matchWeek = !options.week || q.week === options.week;
      return matchCourse && matchWeek;
    });
  }

  if (relevantQuizzes.length === 0) {
    return [];
  }

  const relevantQuizIds = new Set(relevantQuizzes.map((q) => String(q._id)));

  // Map questions by ID → topic
  const questionTopicMap = new Map<string, string>();
  for (const quiz of relevantQuizzes) {
    const questions = quiz.questions ?? [];
    for (const q of questions) {
      if (q._id) {
        // Use topic if available, fall back to quiz topic
        const topic = q.topic || quiz.topic || "General";
        questionTopicMap.set(String(q._id), topic);
      }
    }
  }

  // Analyze wrong answers by topic
  const topicStats = new Map<string, { wrong: number; total: number }>();

  for (const attempt of attempts) {
    // Only count attempts from relevant quizzes
    if (!relevantQuizIds.has(String(attempt.quizId))) {
      continue;
    }

    const questionAttempts = attempt.questionAttempts ?? [];
    for (const qa of questionAttempts) {
      const topic = questionTopicMap.get(qa.questionId) || "Unknown";

      if (!topicStats.has(topic)) {
        topicStats.set(topic, { wrong: 0, total: 0 });
      }

      const stat = topicStats.get(topic)!;
      stat.total += 1;
      if (!qa.isCorrect) {
        stat.wrong += 1;
      }
    }
  }

  // Convert to array and compute accuracy
  const result: WeakTopicStat[] = Array.from(topicStats.entries())
    .map(([topic, { wrong, total }]) => ({
      topic,
      wrongCount: wrong,
      totalAttempts: total,
      accuracy: total === 0 ? 1 : (total - wrong) / total,
    }))
    // Sort by accuracy (weakest first)
    .sort((a, b) => a.accuracy - b.accuracy);

  return result;
}

/**
 * Get top weak topics for a course/week.
 * If week is omitted/empty, analyzes across all weeks of that course.
 * Useful for targeting review question generation.
 */
export async function getTopWeakTopics(
  userId: Types.ObjectId | string,
  course: string,
  week?: string,
  topN: number = 3
): Promise<string[]> {
  const stats = await analyzeWeakTopics(userId, { course, week: week || undefined, limit: 10 });

  // Filter for topics with accuracy < 0.8 (not mastered yet)
  const weakTopics = stats
    .filter((s) => s.accuracy < 0.8 && s.totalAttempts >= 2)
    .slice(0, topN)
    .map((s) => s.topic);

  return weakTopics.length > 0 ? weakTopics : ["General"];
}
