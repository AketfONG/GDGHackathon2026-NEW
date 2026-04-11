import { Suspense } from "react";
import { cookies } from "next/headers";
import { TopNav } from "@/components/top-nav";
import { uiOnlyQuizzes } from "@/lib/ui-quizzes";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";
import { QuizReviewPageClient } from "./quiz-review-client";

export default async function QuizReviewPage() {
  const cookieStore = await cookies();
  const demo = isPresetDemoContentEnabled(getDemoModeFromCookieStore(cookieStore));
  const fallbackDemoQuizId = demo ? uiOnlyQuizzes[0]?.id ?? null : null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <TopNav />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">
            <p className="text-slate-600">Loading review…</p>
          </main>
        </div>
      }
    >
      <QuizReviewPageClient fallbackDemoQuizId={fallbackDemoQuizId} />
    </Suspense>
  );
}
