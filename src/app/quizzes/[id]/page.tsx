import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { QuizAttemptForm } from "@/components/quiz-attempt-form";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import type { UiQuiz } from "@/lib/ui-quizzes";

export const dynamic = "force-dynamic";

function isMongoObjectIdString(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export default async function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
    title: String(row.title ?? "Quiz"),
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
            <QuizAttemptForm quiz={quiz} />
          </div>
        </div>
      </main>
    </div>
  );
}
