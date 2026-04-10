import { NextRequest, NextResponse } from "next/server";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";
import { viewerCanAccessQuiz, isSharedDemoUser } from "@/lib/quiz-access";
import { Types } from "mongoose";

/**
 * Remove an upload-generated cold quiz the viewer can access, and all attempts for that quiz.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();

  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid quiz id" }, { status: 400 });
  }

  const row = await QuizModel.findById(id).lean();
  if (!row) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const q = row as {
    testType?: string;
    createdFromUpload?: boolean;
    course?: string;
    week?: string;
    ownerUserId?: unknown;
    quizClientScope?: string | null;
  };
  if (
    q.testType !== "cold" ||
    q.createdFromUpload !== true ||
    !String(q.course ?? "").trim() ||
    !String(q.week ?? "").trim()
  ) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const scope = req.cookies.get(QUIZ_CLIENT_SCOPE_COOKIE)?.value ?? null;
  const viewerIsDemo = isSharedDemoUser(
    auth.user as { email?: string | null; firebaseUid?: string | null },
  );
  if (!viewerCanAccessQuiz(q, { userId: auth.user._id, scope, viewerIsDemo })) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  await QuizAttemptModel.deleteMany({ quizId: new Types.ObjectId(id) });
  await QuizModel.findByIdAndDelete(id);

  return NextResponse.json({ ok: true });
}
