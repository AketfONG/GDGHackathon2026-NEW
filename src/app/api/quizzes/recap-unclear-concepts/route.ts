import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { getUnclearConcepts } from "@/lib/weak-area-analyzer";
import { isBackendDisabled, backendDisabledResponse } from "@/lib/backend-toggle";

/**
 * POST /api/quizzes/recap-unclear-concepts
 * 
 * Recalculates unclear concepts AFTER review quiz submission.
 * Includes all attempts: cold, hot, AND review quiz results.
 * Used to update the post-submission summary with latest analysis.
 * 
 * Request: { course, week? }
 * Response: { unclearConcepts: string[] }
 */

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();

  try {
    const auth = await verifyRequestToken(req);
    if (!auth.ok) return auth.response;

    await connectToDatabase();

    const body = await req.json();
    const course = String(body.course ?? "").trim();
    const week = String(body.week ?? "").trim();

    if (!course) {
      return NextResponse.json(
        { error: "Course is required" },
        { status: 400 }
      );
    }

    // Recalculate unclear concepts INCLUDING review attempts
    console.log(`[recap-unclear-concepts] recalculating for course=${course}, week=${week}, includeReview=true`);
    const unclearConcepts = await getUnclearConcepts(
      auth.user._id,
      course,
      week || undefined,
      3,
      true  // includeReview = true
    );
    console.log(`[recap-unclear-concepts] returned concepts:`, unclearConcepts);

    return NextResponse.json({
      unclearConcepts,
      message: `Updated unclear concepts based on all attempts (cold, hot, and review)`,
    });
  } catch (error) {
    console.error("recap-unclear-concepts error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to recalculate concepts",
      },
      { status: 500 }
    );
  }
}
