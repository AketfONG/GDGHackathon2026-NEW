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

/** April 15 in the same calendar year as `referenceDate` (YYYY-04-15). */
export function april15DateString(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  return `${y}-04-15`;
}

/** April 18 in the same calendar year as `referenceDate` (YYYY-04-18). */
export function april18DateString(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  return `${y}-04-18`;
}

/** April 20 in the same calendar year as `referenceDate` (YYYY-04-20). */
export function april20DateString(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  return `${y}-04-20`;
}

/** Local calendar date for `referenceDate` (YYYY-MM-DD). */
export function localDateString(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
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
      subtopic: "Central Limit Theorem",
      testType: "hot",
      title: "Hot quiz",
      status: "not-started",
      dueDate: addDaysLocalDateString(referenceDate, 2),
    },
    {
      id: "scheduled-temg3950-review",
      course: "TEMG3950",
      subtopic: "MECE Frameworks",
      testType: "review",
      title: "Review",
      status: "not-started",
      dueDate: addDaysLocalDateString(referenceDate, 4),
    },
    {
      id: "scheduled-huma2104-hot",
      course: "HUMA2104",
      subtopic: "Counterpoint",
      testType: "hot",
      title: "Hot quiz",
      status: "not-started",
      dueDate: addDaysLocalDateString(referenceDate, 5),
    },
    {
      id: "scheduled-mark3220-hot",
      course: "MARK3220",
      subtopic: "Marketing Research Processes",
      testType: "hot",
      title: "Hot quiz",
      status: "not-started",
      dueDate: april15DateString(referenceDate),
    },
    {
      id: "scheduled-comp3511-review",
      course: "COMP3511",
      subtopic: "I/O Systems",
      testType: "review",
      title: "Review",
      status: "not-started",
      dueDate: april18DateString(referenceDate),
    },
    {
      id: "scheduled-econ2103-review",
      course: "ECON2103",
      subtopic: "Monopoly",
      testType: "review",
      title: "Review",
      status: "not-started",
      dueDate: april20DateString(referenceDate),
    },
  ];
}

export function getScheduledStudyTasks(referenceDate: Date = new Date()): ScheduledStudyTask[] {
  const d2 = addDaysLocalDateString(referenceDate, 2);
  const d4 = addDaysLocalDateString(referenceDate, 4);
  const d5 = addDaysLocalDateString(referenceDate, 5);
  const dApr15 = april15DateString(referenceDate);
  const dApr18 = april18DateString(referenceDate);
  const dApr20 = april20DateString(referenceDate);

  return [
    {
      id: "scheduled-math2411-hot",
      date: d2,
      title: "MATH2411 — Hot quiz",
      type: "hot_quiz",
      topic: "MATH2411 · Central Limit Theorem",
      priority: "high",
      time: `Due ${new Date(d2 + "T12:00:00").toLocaleDateString()}`,
      duration: "45 min",
      description: "Central Limit Theorem practice — open from Quizzes or from a selected calendar day.",
    },
    {
      id: "scheduled-temg3950-review",
      date: d4,
      title: "TEMG3950 — Review",
      type: "review_quiz",
      topic: "TEMG3950 · MECE Frameworks",
      priority: "medium",
      time: `Due ${new Date(d4 + "T12:00:00").toLocaleDateString()}`,
      duration: "60 min",
      description: "MECE frameworks review — listed under Review on the Quizzes page.",
    },
    {
      id: "scheduled-huma2104-hot",
      date: d5,
      title: "HUMA2104 — Hot quiz",
      type: "hot_quiz",
      topic: "HUMA2104 · Counterpoint",
      priority: "high",
      time: `Due ${new Date(d5 + "T12:00:00").toLocaleDateString()}`,
      duration: "40 min",
      description: "Counterpoint practice — open from Quizzes or from a selected calendar day.",
    },
    {
      id: "scheduled-mark3220-hot",
      date: dApr15,
      title: "MARK3220 — Hot quiz",
      type: "hot_quiz",
      topic: "MARK3220 · Marketing Research Processes",
      priority: "high",
      time: `Due ${new Date(dApr15 + "T12:00:00").toLocaleDateString()}`,
      duration: "45 min",
      description:
        "Marketing research processes — due Apr 15. Open from Quizzes or from a selected calendar day.",
    },
    {
      id: "scheduled-comp3511-review",
      date: dApr18,
      title: "COMP3511 — Review",
      type: "review_quiz",
      topic: "COMP3511 · I/O Systems",
      priority: "medium",
      time: `Due ${new Date(dApr18 + "T12:00:00").toLocaleDateString()}`,
      duration: "60 min",
      description: "I/O systems review — due Apr 18. Listed under Review on the Quizzes page.",
    },
    {
      id: "scheduled-econ2103-review",
      date: dApr20,
      title: "ECON2103 — Review",
      type: "review_quiz",
      topic: "ECON2103 · Monopoly",
      priority: "medium",
      time: `Due ${new Date(dApr20 + "T12:00:00").toLocaleDateString()}`,
      duration: "60 min",
      description: "Monopoly review — due Apr 20. Listed under Review on the Quizzes page.",
    },
  ];
}

/** Review-quiz topics due on or after `referenceDate`’s calendar day (for “unclear concepts” / focus areas). */
export function getUpcomingReviewQuizConcepts(
  referenceDate: Date = new Date(),
): { quizId: string; course: string; concept: string; dueDate: string }[] {
  const today = localDateString(referenceDate);
  return getScheduledCourseQuizzes(referenceDate)
    .filter((q) => q.testType === "review" && q.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.course.localeCompare(b.course))
    .map((q) => ({
      quizId: q.id,
      course: q.course,
      concept: q.subtopic ?? q.course,
      dueDate: q.dueDate!,
    }));
}
