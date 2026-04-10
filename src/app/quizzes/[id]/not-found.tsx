import Link from "next/link";
import { TopNav } from "@/components/top-nav";

export default function QuizNotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Quiz not found</h1>
        <p className="mt-2 text-slate-600">That quiz may have been removed or the link is invalid.</p>
        <Link href="/quizzes" className="mt-6 inline-block font-semibold text-blue-600 hover:text-blue-700">
          ← Back to Quizzes
        </Link>
      </main>
    </div>
  );
}
