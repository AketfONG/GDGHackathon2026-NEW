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

/** Cards: white surface + slate outline; soft left accent by section type (Cold/Hot/Review headings are outside). */
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

interface QuizListProps {
  quizzes: CourseQuiz[];
}

function quizHref(quiz: CourseQuiz): string {
  return quiz.externalHref ?? `/quizzes/${encodeURIComponent(quiz.id)}`;
}

/** Subject line: first character uppercased; rest lowercased per word for phrases; course codes stay fully uppercased. */
function formatSubjectName(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const compact = s.replace(/\s+/g, " ");
  if (/^[A-Za-z]{2,}[A-Za-z0-9]*(?:\s+[A-Za-z0-9]+)*$/.test(compact) && compact.length <= 24 && !compact.includes(" ")) {
    return compact.toUpperCase();
  }
  return compact
    .split(" ")
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function statusLine(quiz: CourseQuiz): string {
  if (quiz.status === "completed" && quiz.score != null) {
    return `${quiz.score}%`;
  }
  if (quiz.status === "in-progress") {
    return "In progress";
  }
  return "Not done";
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

const primaryPillBase =
  "no-underline px-5 py-2 text-sm font-semibold !text-white visited:!text-white hover:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

function ColdHotQuizCard({ quiz }: { quiz: CourseQuiz }) {
  const isHot = quiz.testType === "hot";
  const startCls = isHot
    ? `bg-rose-400 ${primaryPillBase} transition-colors hover:bg-rose-500 focus-visible:outline-rose-500`
    : `bg-sky-400 ${primaryPillBase} transition-colors hover:bg-[#3498db] focus-visible:outline-sky-500`;
  const continueCls = isHot
    ? `bg-rose-400 ${primaryPillBase} transition-colors hover:bg-rose-500 focus-visible:outline-rose-500`
    : `bg-amber-400 ${primaryPillBase} transition-colors hover:bg-amber-500 focus-visible:outline-amber-600`;

  return (
    <div className={`rounded-2xl border-2 p-5 ${getTestTypeCardStyle(quiz.testType)}`}>
      <div className="flex flex-row items-start justify-between gap-4">
        <p className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {formatSubjectName(quiz.course)}
        </p>
        <div className="shrink-0 space-y-1 text-right">
          {quiz.dueDate ? (
            <p className="text-sm text-slate-600">
              Due: {new Date(quiz.dueDate + "T12:00:00").toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No due date</p>
          )}
          <p className="text-sm font-semibold text-slate-800">{statusLine(quiz)}</p>
          {quiz.status === "completed" && quiz.correctAnswers != null && quiz.totalQuestions != null ? (
            <p className="text-xs text-slate-500">
              {quiz.correctAnswers}/{quiz.totalQuestions} correct
            </p>
          ) : null}
        </div>
      </div>

      {quiz.status === "not-started" ||
      quiz.status === "in-progress" ||
      (quiz.status === "completed" && isMongoObjectIdString(quiz.id)) ? (
        <div className="mt-4 flex flex-row flex-wrap items-center gap-2">
          {quiz.status === "not-started" ? (
            <>
              <Link
                href={quizHref(quiz)}
                className={`inline-flex items-center justify-center rounded-full ${startCls}`}
              >
                Take quiz
              </Link>
              {quiz.testType === "cold" && isMongoObjectIdString(quiz.id) ? (
                <DeleteColdQuizButton inline quizId={quiz.id} quizTitle={quiz.title} />
              ) : null}
            </>
          ) : null}
          {quiz.status === "in-progress" ? (
            <>
              <Link
                href={quizHref(quiz)}
                className={`inline-flex items-center justify-center rounded-full ${continueCls}`}
              >
                Take quiz
              </Link>
              {quiz.testType === "cold" && isMongoObjectIdString(quiz.id) ? (
                <DeleteColdQuizButton inline quizId={quiz.id} quizTitle={quiz.title} />
              ) : null}
            </>
          ) : null}
          {quiz.status === "completed" && isMongoObjectIdString(quiz.id) ? (
            <DeleteColdQuizButton inline quizId={quiz.id} quizTitle={quiz.title} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReviewQuizCard({ quiz }: { quiz: CourseQuiz }) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${getTestTypeCardStyle(quiz.testType)}`}>
      <div className="flex flex-row items-start justify-between gap-4">
        <p className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {formatSubjectName(quiz.course)}
        </p>
        <div className="shrink-0 space-y-1 text-right">
          {quiz.dueDate ? (
            <p className="text-sm text-slate-600">
              Due: {new Date(quiz.dueDate + "T12:00:00").toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No due date</p>
          )}
          <p className="text-sm font-semibold text-slate-800">{statusLine(quiz)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-row flex-wrap items-center gap-2">
        {quiz.status === "completed" ? (
          <Link
            href={quizHref(quiz)}
            className={`inline-flex items-center justify-center rounded-full bg-slate-600 ${primaryPillBase} transition-colors hover:bg-slate-700 focus-visible:outline-slate-600`}
          >
            Review
          </Link>
        ) : null}
        <Link
          href={quizHref(quiz)}
          className={`inline-flex items-center justify-center rounded-full bg-violet-400 ${primaryPillBase} transition-colors hover:bg-violet-500 focus-visible:outline-violet-500`}
        >
          {quiz.status === "completed" ? "Retake" : "Take quiz"}
        </Link>
        {quiz.status === "completed" && isMongoObjectIdString(quiz.id) ? (
          <DeleteColdQuizButton inline quizId={quiz.id} quizTitle={quiz.title} />
        ) : null}
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
