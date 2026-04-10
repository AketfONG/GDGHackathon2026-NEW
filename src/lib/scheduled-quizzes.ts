import type { CourseQuiz } from "@/components/quiz-list";

/** YYYY-MM-DD in local timezone */
export function addDaysLocalDateString(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type ScheduledStudyTask = {
  id: string;
  date: string;
  title: string;
  type: "hot_quiz" | "cold_quiz" | "review_quiz" | "study_topic";
  topic: string;
  priority: "high" | "medium" | "low";
  time: string;
  duration: string;
  description: string;
};

/**
 * Hard-coded upcoming quizzes (relative to referenceDate) for dashboard + schedule.
 * Links resolve to `/quizzes/[id]` with default MCQs (see `default-scheduled-quizzes.ts`).
 */
export function getScheduledCourseQuizzes(referenceDate: Date = new Date()): CourseQuiz[] {
  return [
    {
      id: "scheduled-math2411-hot",
      course: "MATH2411",
      testType: "hot",
      title: "Hot quiz",
      status: "not-started",
      dueDate: addDaysLocalDateString(referenceDate, 2),
    },
    {
      id: "scheduled-temg3950-review",
      course: "TEMG3950",
      testType: "review",
      title: "Review",
      topic: "Case analysis",
      status: "not-started",
      dueDate: addDaysLocalDateString(referenceDate, 4),
    },
    {
      id: "scheduled-huma2104-hot",
      course: "HUMA2104",
      testType: "hot",
      title: "Hot quiz",
      status: "not-started",
      dueDate: addDaysLocalDateString(referenceDate, 5),
    },
  ];
}

export function getScheduledStudyTasks(referenceDate: Date = new Date()): ScheduledStudyTask[] {
  const d2 = addDaysLocalDateString(referenceDate, 2);
  const d4 = addDaysLocalDateString(referenceDate, 4);
  const d5 = addDaysLocalDateString(referenceDate, 5);

  return [
    {
      id: "scheduled-math2411-hot",
      date: d2,
      title: "MATH2411 — Hot quiz",
      type: "hot_quiz",
      topic: "MATH2411",
      priority: "high",
      time: `Due ${new Date(d2 + "T12:00:00").toLocaleDateString()}`,
      duration: "45 min",
      description: "Probability practice quiz — open from Quizzes or start here after selecting the date.",
    },
    {
      id: "scheduled-temg3950-review",
      date: d4,
      title: "TEMG3950 — Review",
      type: "review_quiz",
      topic: "TEMG3950",
      priority: "medium",
      time: `Due ${new Date(d4 + "T12:00:00").toLocaleDateString()}`,
      duration: "60 min",
      description: "Case analysis review — listed under Review on the Quizzes page.",
    },
    {
      id: "scheduled-huma2104-hot",
      date: d5,
      title: "HUMA2104 — Hot quiz",
      type: "hot_quiz",
      topic: "HUMA2104",
      priority: "high",
      time: `Due ${new Date(d5 + "T12:00:00").toLocaleDateString()}`,
      duration: "40 min",
      description: "Music theory practice quiz — open from Quizzes or start here after selecting the date.",
    },
  ];
}
