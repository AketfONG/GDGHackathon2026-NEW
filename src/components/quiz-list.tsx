import Link from "next/link";

export interface CourseQuiz {
  id: string;
  course: string;
  week?: number;
  testType: "cold" | "hot" | "review";
  topic?: string;
  title: string;
  status: "not-started" | "in-progress" | "completed";
  dueDate?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
}

function getTestTypeColor(testType: "cold" | "hot" | "review"): string {
  switch (testType) {
    case "cold":
      return "bg-blue-50 border-blue-200";
    case "hot":
      return "bg-red-50 border-red-200";
    case "review":
      return "bg-purple-50 border-purple-200";
    default:
      return "bg-slate-50 border-slate-200";
  }
}

function getTestTypeBadge(testType: "cold" | "hot" | "review"): string {
  switch (testType) {
    case "cold":
      return "bg-blue-100 text-blue-800";
    case "hot":
      return "bg-red-100 text-red-800";
    case "review":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function getStatusBadge(status: "not-started" | "in-progress" | "completed"): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-yellow-100 text-yellow-800";
    case "not-started":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

interface QuizListProps {
  quizzes: CourseQuiz[];
}

export function QuizList({ quizzes }: QuizListProps) {
  // Group quizzes by course
  const courseGroups = quizzes.reduce(
    (acc, quiz) => {
      const key = quiz.course;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(quiz);
      return acc;
    },
    {} as Record<string, CourseQuiz[]>
  );

  if (Object.keys(courseGroups).length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-600">
          No quizzes yet. Upload course materials above to generate quizzes!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(courseGroups).map(([courseName, courseQuizzes]) => (
        <section key={courseName}>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            {courseName}
          </h2>

          <div className="space-y-6">
            {/* Weekly Tests (Cold & Hot) */}
            {courseQuizzes.filter((q) => q.testType !== "review").length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Weekly Tests
                </h3>
                <div className="space-y-4">
                  {courseQuizzes
                    .filter((q) => q.testType !== "review")
                    .sort((a, b) => {
                      const weekA = a.week || 0;
                      const weekB = b.week || 0;
                      return weekA - weekB;
                    })
                    .map((quiz) => (
                      <div
                        key={quiz.id}
                        className={`rounded-lg border p-5 ${getTestTypeColor(quiz.testType)} transition hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getTestTypeBadge(quiz.testType)}`}
                              >
                                {quiz.testType.toUpperCase()}
                              </span>
                              {quiz.week && (
                                <span className="text-sm font-medium text-slate-600">
                                  Week {quiz.week}
                                </span>
                              )}
                            </div>
                            <h4 className="mt-2 font-semibold text-slate-900">
                              {quiz.title}
                            </h4>
                            {quiz.dueDate && (
                              <p className="mt-1 text-sm text-slate-500">
                                Due: {new Date(quiz.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusBadge(quiz.status)}`}
                            >
                              {quiz.status === "not-started"
                                ? "Not Started"
                                : quiz.status === "in-progress"
                                  ? "In Progress"
                                  : "Completed"}
                            </span>
                            {quiz.status === "completed" && (
                              <div className="mt-2">
                                <p className="text-lg font-bold text-slate-900">
                                  {quiz.score}%
                                </p>
                                <p className="text-sm text-slate-600">
                                  {quiz.correctAnswers}/{quiz.totalQuestions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {quiz.status === "not-started" && (
                            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                              Start Quiz
                            </button>
                          )}
                          {quiz.status === "in-progress" && (
                            <button className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700">
                              Continue
                            </button>
                          )}
                          {quiz.status === "completed" && (
                            <>
                              <button className="rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                                Review
                              </button>
                              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                Retake
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Review Tests */}
            {courseQuizzes.filter((q) => q.testType === "review").length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Review Tests{" "}
                  <span className="text-sm font-normal text-slate-500">
                    (Unlimited)
                  </span>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {courseQuizzes
                    .filter((q) => q.testType === "review")
                    .map((quiz) => (
                      <div
                        key={quiz.id}
                        className={`rounded-lg border p-5 ${getTestTypeColor(quiz.testType)} transition hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getTestTypeBadge(quiz.testType)}`}
                              >
                                REVIEW
                              </span>
                            </div>
                            <h4 className="mt-2 font-semibold text-slate-900">
                              {quiz.title}
                            </h4>
                            {quiz.topic && (
                              <p className="mt-1 text-sm text-slate-600">
                                Topic: {quiz.topic}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusBadge(quiz.status)}`}
                            >
                              {quiz.status === "completed"
                                ? "Last Score"
                                : "Not Started"}
                            </span>
                            {quiz.status === "completed" && (
                              <div className="mt-2">
                                <p className="text-lg font-bold text-slate-900">
                                  {quiz.score}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                            {quiz.status === "completed"
                              ? "Practice Again"
                              : "Start Review"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
