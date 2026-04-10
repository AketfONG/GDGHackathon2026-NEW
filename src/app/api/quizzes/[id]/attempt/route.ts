import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { PassiveSignalEventModel } from "@/models/PassiveSignalEvent";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";
import { viewerCanAccessQuiz, isSharedDemoUser } from "@/lib/quiz-access";
import { Types } from "mongoose";

type QuizQuestion = {
  _id: Types.ObjectId;
  correctIdx: number;
};

const submitAttemptSchema = z.object({
  durationSec: z.number().int().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedIdx: z.number().int().min(0),
      responseMs: z.number().int().min(0),
    }),
  ),
});

export async function POST(
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

  const body = await req.json();
  const parsed = submitAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = auth.user;
  const quiz = await QuizModel.findById(id).lean();
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }
  const q = quiz as {
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
    user as { email?: string | null; firebaseUid?: string | null },
  );
  if (!viewerCanAccessQuiz(q, { userId: user._id, scope, viewerIsDemo })) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const questions = (quiz.questions ?? []) as QuizQuestion[];
  const questionMap = new Map<string, QuizQuestion>(questions.map((q) => [String(q._id), q]));
  let correct = 0;
  const questionAttempts = parsed.data.answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    const isCorrect = question ? question.correctIdx === answer.selectedIdx : false;
    if (isCorrect) correct += 1;
    return {
      questionId: answer.questionId,
      selectedIdx: answer.selectedIdx,
      responseMs: answer.responseMs,
      isCorrect,
    };
  });

  const answered = parsed.data.answers.length;
  const score = answered === 0 ? 0 : correct / answered;

  const attempt = await QuizAttemptModel.create({
    userId: user._id,
    quizId: quiz._id,
    score,
    durationSec: parsed.data.durationSec,
    questionAttempts,
  });

  await PassiveSignalEventModel.create({
    userId: user._id,
    type: "QUIZ_SUBMIT",
    meta: { quizId: String(quiz._id), score },
  });

  const cycle = await runInterventionCycle(String(user._id));
  return NextResponse.json({ attempt: attempt.toObject(), assessment: cycle.assessment, intervention: cycle.intervention });
}
