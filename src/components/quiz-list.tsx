import Link from "next/link";
import { DeleteColdQuizButton } from "@/components/delete-cold-quiz-button";
import { isMongoObjectIdString } from "@/lib/mongo-object-id";

export interface CourseQuiz {
  id: string;
  course: string;
  /** Shown after the course on the first line, e.g. "MATH2411 · Probability". */
  subtopic?: string;
  week?: number;
  testType: "cold" | "hot" | "review";
  topic?: string;
  title: string;
  status: "not-started" | "in-progress" | "completed";
  dueDate?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  /** If set, action links go here instead of `/quizzes/[id]` (e.g. placeholder schedule items). */
  externalHref?: string;
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

function quizHref(quiz: CourseQuiz): string {
  return quiz.externalHref ?? `/quizzes/${encodeURIComponent(quiz.id)}`;
}

function courseHeading(quiz: CourseQuiz): string {
  return quiz.subtopic ? `${quiz.course} · ${quiz.subtopic}` : quiz.course;
}

function sortCold(a: CourseQuiz, b: CourseQuiz): number {
  const byCourse = a.course.localeCompare(b.course);
  if (byCourse !== 0) return byCourse;
  return (a.week || 0) - (b.week || 0);
}

function sortHot(a: CourseQuiz, b: CourseQuiz): number {
  const byCourse = a.course.localeCompare(b.course);
  if (byCourse !== 0) return byCourse;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.title.localeCompare(b.title);
}

function sortReview(a: CourseQuiz, b: CourseQuiz): number {
  return a.course.localeCompare(b.course);
}

function ColdHotQuizCard({ quiz }: { quiz: CourseQuiz }) {
  const isHot = quiz.testType === "hot";
  const startCls = isHot
    ? "bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
    : "bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700";
  const continueCls = isHot
    ? "bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
    : "bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700";
  const retakeCls = isHot
    ? "border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50"
    : "border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

  return (
    <div
      className={`rounded-lg border p-5 ${getTestTypeColor(quiz.testType)} transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{courseHeading(quiz)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getTestTypeBadge(quiz.testType)}`}
            >
              {quiz.testType.toUpperCase()}
            </span>
            {quiz.week ? (
              <span className="text-sm font-medium text-slate-600">Week {quiz.week}</span>
            ) : null}
          </div>
          <h4 className="mt-2 font-semibold text-slate-900">{quiz.title}</h4>
          {quiz.dueDate ? (
            <p className="mt-1 text-sm text-slate-500">
              Due: {new Date(quiz.dueDate).toLocaleDateString()}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusBadge(quiz.status)}`}
          >
            {quiz.status === "not-started"
              ? "Not Started"
              : quiz.status === "in-progress"
                ? "In Progress"
                : "Done"}
          </span>
          {quiz.status === "completed" ? (
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-900">{quiz.score}%</p>
              <p className="text-sm text-slate-600">
                {quiz.correctAnswers}/{quiz.totalQuestions}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {quiz.status === "not-started" ? (
          <Link
            href={quizHref(quiz)}
            className={`inline-flex items-center justify-center rounded-md ${startCls}`}
          >
            Start Quiz
          </Link>
        ) : null}
        {quiz.status === "in-progress" ? (
          <Link
            href={quizHref(quiz)}
            className={`inline-flex items-center justify-center rounded-md ${continueCls}`}
          >
            Continue
          </Link>
        ) : null}
        {quiz.status === "completed" ? (
          <>
            <Link
              href={quizHref(quiz)}
              className="inline-flex items-center justify-center rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Review
            </Link>
            <Link
              href={quizHref(quiz)}
              className={`inline-flex items-center justify-center rounded-md ${retakeCls}`}
            >
              Retake
            </Link>
          </>
        ) : null}
      </div>
      {quiz.testType === "cold" && isMongoObjectIdString(quiz.id) ? (
        <DeleteColdQuizButton quizId={quiz.id} quizTitle={quiz.title} />
      ) : null}
    </div>
  );
}

/** Same full-width card layout as cold/hot (no grid column), so single review rows match width. */
function ReviewQuizCard({ quiz }: { quiz: CourseQuiz }) {
  return (
    <div
      className={`rounded-lg border p-5 ${getTestTypeColor(quiz.testType)} transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{courseHeading(quiz)}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getTestTypeBadge(quiz.testType)}`}
            >
              REVIEW
            </span>
          </div>
          <h4 className="mt-2 font-semibold text-slate-900">{quiz.title}</h4>
          {quiz.dueDate ? (
            <p className="mt-1 text-sm text-slate-500">
              Due: {new Date(quiz.dueDate).toLocaleDateString()}
            </p>
          ) : null}
          {quiz.topic && !quiz.subtopic ? (
            <p className="mt-1 text-sm text-slate-600">Topic: {quiz.topic}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusBadge(quiz.status)}`}
          >
            {quiz.status === "completed" ? "Last Score" : "Not Started"}
          </span>
          {quiz.status === "completed" ? (
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-900">{quiz.score}%</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={quizHref(quiz)}
          className="inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          {quiz.status === "completed" ? "Practice Again" : "Start Review"}
        </Link>
      </div>
    </div>
  );
}

export function QuizList({ quizzes }: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="text-lg text-slate-600">No quizzes yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Upload course materials on the{" "}
          <Link href="/upload" className="font-semibold text-blue-600 underline hover:text-blue-700">
            Upload Materials
          </Link>{" "}
          page to generate your first cold test.
        </p>
      </div>
    );
  }

  const cold = quizzes.filter((q) => q.testType === "cold").sort(sortCold);
  const hot = quizzes.filter((q) => q.testType === "hot").sort(sortHot);
  const review = quizzes.filter((q) => q.testType === "review").sort(sortReview);

  return (
    <div className="space-y-12">
      {cold.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Cold</h2>
          <div className="space-y-4">
            {cold.map((quiz) => (
              <ColdHotQuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </section>
      ) : null}

      {hot.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Hot</h2>
          <div className="space-y-4">
            {hot.map((quiz) => (
              <ColdHotQuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </section>
      ) : null}

      {review.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Review</h2>
          <div className="space-y-4">
            {review.map((quiz) => (
              <ReviewQuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
