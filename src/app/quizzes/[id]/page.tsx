import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import type { UiQuiz } from "@/lib/ui-quizzes";
import { getDefaultScheduledUiQuiz } from "@/lib/default-scheduled-quizzes";
import { getServerUser } from "@/lib/auth/server-user";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";
import { viewerCanAccessQuiz, isSharedDemoUser } from "@/lib/quiz-access";
import { isMongoObjectIdString } from "@/lib/mongo-object-id";

export const dynamic = "force-dynamic";

export default async function QuizTakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const isHotFollowup = mode === "hot-followup";

  const defaultQuiz = getDefaultScheduledUiQuiz(id);
  if (defaultQuiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <main className="mx-auto w-full max-w-3xl px-4 py-8">
          <Link href="/quizzes" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Back to Quizzes
          </Link>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-bold text-slate-900">{defaultQuiz.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {defaultQuiz.topic} · {defaultQuiz.difficulty}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Default practice quiz — results are shown on this device only (not saved to your account).
            </p>
            <div className="mt-6">
              <QuizAttemptForm quiz={defaultQuiz} isHotFollowup={false} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isMongoObjectIdString(id)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <main className="mx-auto max-w-lg px-4 py-12">
          <h1 className="text-xl font-semibold text-slate-900">Quiz not available</h1>
          <p className="mt-3 text-slate-600">
            This entry is a preview or sample. To take a real quiz, upload course materials (or ensure
            MongoDB is connected) so a quiz is saved with a database id, then open it from the list
            again.
          </p>
          <Link href="/quizzes" className="mt-6 inline-block font-semibold text-blue-600 hover:text-blue-700">
            ← Back to Quizzes
          </Link>
        </main>
      </div>
    );
  }

  try {
    await connectToDatabase();
  } catch {
    notFound();
  }

  const row = await QuizModel.findById(id).lean();
  if (!row) {
    notFound();
  }

  const rowTyped = row as {
    testType?: string;
    createdFromUpload?: boolean;
    course?: string;
    week?: string;
    ownerUserId?: unknown;
    quizClientScope?: string | null;
  };
  if (
    rowTyped.testType !== "cold" ||
    rowTyped.createdFromUpload !== true ||
    !String(rowTyped.course ?? "").trim() ||
    !String(rowTyped.week ?? "").trim()
  ) {
    notFound();
  }

  const cookieStore = await cookies();
  const scope = cookieStore.get(QUIZ_CLIENT_SCOPE_COOKIE)?.value ?? null;
  const user = await getServerUser();
  const viewerIsDemo = isSharedDemoUser(
    user as { email?: string | null; firebaseUid?: string | null } | null,
  );
  if (!viewerCanAccessQuiz(rowTyped, { userId: user?._id, scope, viewerIsDemo })) {
    notFound();
  }

  const questions = (row.questions ?? []).map((q: Record<string, unknown>, i: number) => ({
    id: String((q as { _id?: unknown })._id ?? `q-${i}`),
    prompt: String((q as { prompt?: string }).prompt ?? ""),
    options: (Array.isArray((q as { options?: unknown }).options)
      ? (q as { options: unknown[] }).options
      : []
    ).map((o) => String(o)),
    correctIdx: Number((q as { correctIdx?: number }).correctIdx ?? 0),
    explanation: String((q as { explanation?: string }).explanation ?? "No explanation provided."),
  }));

  const quiz: UiQuiz = {
    id: String(row._id),
    title: isHotFollowup
      ? String(row.title ?? "Quiz").replace("Cold Test", "Hot Test").replace("cold test", "hot test")
      : String(row.title ?? "Quiz"),
    topic: String(row.topic ?? "General"),
    difficulty: String(row.difficulty ?? "mixed"),
    questions,
  };

  if (quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <main className="mx-auto max-w-lg px-4 py-12">
          <h1 className="text-xl font-semibold text-slate-900">{quiz.title}</h1>
          <p className="mt-3 text-slate-600">This quiz has no questions yet.</p>
          <Link href="/quizzes" className="mt-6 inline-block font-semibold text-blue-600 hover:text-blue-700">
            ← Back to Quizzes
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <Link href="/quizzes" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          ← Back to Quizzes
        </Link>
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {quiz.topic} · {quiz.difficulty}
          </p>
          <div className="mt-6">
            <QuizAttemptForm quiz={quiz} isHotFollowup={isHotFollowup} />
          </div>
        </div>
      </main>
    </div>
  );
}
