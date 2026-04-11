import Link from "next/link";
import { DeleteColdQuizButton } from "@/components/delete-cold-quiz-button";
import { isMongoObjectIdString } from "@/lib/mongo-object-id";

export interface CourseQuiz {
  id: string;
  course: string;
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

/** Cards: white surface + slate outline; soft left accent (nav-adjacent tones) */
function getTestTypeCardStyle(testType: "cold" | "hot" | "review"): string {
  switch (testType) {
    case "cold":
      return "border-slate-200 border-l-4 border-l-sky-400 bg-white";
    case "hot":
      return "border-slate-200 border-l-4 border-l-rose-400 bg-white";
    case "review":
      return "border-slate-200 border-l-4 border-l-violet-400 bg-white";
    default:
      return "border-slate-200 bg-white";
  }
}

function getTestTypeBadge(testType: "cold" | "hot" | "review"): string {
  switch (testType) {
    case "cold":
      return "bg-sky-50 text-sky-700";
    case "hot":
      return "bg-rose-50 text-rose-700";
    case "review":
      return "bg-violet-50 text-violet-700";
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

/** Soonest due date first (YYYY-MM-DD ascending); missing dates last; then course, week, id. */
function sortQuizzesByDueDateAsc(a: CourseQuiz, b: CourseQuiz): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate.localeCompare(b.dueDate);
  }
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  const byCourse = a.course.localeCompare(b.course);
  if (byCourse !== 0) return byCourse;
  if ((a.week || 0) !== (b.week || 0)) return (a.week || 0) - (b.week || 0);
  return a.id.localeCompare(b.id);
}

/** Primary pill: soft fills + forced white label (overrides default link color) */
const primaryPillBase =
  "no-underline px-5 py-2 text-sm font-semibold text-white visited:text-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

function ColdHotQuizCard({ quiz }: { quiz: CourseQuiz }) {
  const isHot = quiz.testType === "hot";
  const startCls = isHot
    ? `bg-rose-400 ${primaryPillBase} transition-colors hover:bg-rose-500 focus-visible:outline-rose-500`
    : `bg-sky-400 ${primaryPillBase} transition-colors hover:bg-[#3498db] focus-visible:outline-sky-500`;
  const continueCls = isHot
    ? `bg-rose-400 ${primaryPillBase} transition-colors hover:bg-rose-500 focus-visible:outline-rose-500`
    : `bg-amber-400 ${primaryPillBase} transition-colors hover:bg-amber-500 focus-visible:outline-amber-600`;
  const retakeCls = isHot
    ? "border-2 border-rose-100 bg-white px-5 py-2 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-50"
    : "border-2 border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50";

  return (
    <div className={`rounded-2xl border-2 p-5 ${getTestTypeCardStyle(quiz.testType)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{quiz.course}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTestTypeBadge(quiz.testType)}`}
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
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(quiz.status)}`}
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
            className={`inline-flex items-center justify-center rounded-full ${startCls}`}
          >
            Start Quiz
          </Link>
        ) : null}
        {quiz.status === "in-progress" ? (
          <Link
            href={quizHref(quiz)}
            className={`inline-flex items-center justify-center rounded-full ${continueCls}`}
          >
            Continue
          </Link>
        ) : null}
        {quiz.status === "completed" ? (
          <>
            <Link
              href={quizHref(quiz)}
              className={`inline-flex items-center justify-center rounded-full bg-slate-600 ${primaryPillBase} transition-colors hover:bg-slate-700 focus-visible:outline-slate-600`}
            >
              Review
            </Link>
            <Link
              href={quizHref(quiz)}
              className={`inline-flex items-center justify-center rounded-full ${retakeCls}`}
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
    <div className={`rounded-2xl border-2 p-5 ${getTestTypeCardStyle(quiz.testType)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{quiz.course}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTestTypeBadge(quiz.testType)}`}
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
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(quiz.status)}`}
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
          className={`inline-flex items-center justify-center rounded-full bg-violet-400 ${primaryPillBase} transition-colors hover:bg-violet-500 focus-visible:outline-violet-500`}
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
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
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

  const cold = quizzes.filter((q) => q.testType === "cold").sort(sortQuizzesByDueDateAsc);
  const hot = quizzes.filter((q) => q.testType === "hot").sort(sortQuizzesByDueDateAsc);
  const review = quizzes.filter((q) => q.testType === "review").sort(sortQuizzesByDueDateAsc);

  return (
    <div className="space-y-12">
      {cold.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">Cold</h2>
          <div className="space-y-4">
            {cold.map((quiz) => (
              <ColdHotQuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </section>
      ) : null}

      {hot.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">Hot</h2>
          <div className="space-y-4">
            {hot.map((quiz) => (
              <ColdHotQuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </section>
      ) : null}

      {review.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">Review</h2>
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
