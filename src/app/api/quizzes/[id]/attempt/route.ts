import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { runInterventionCycle } from "@/lib/interventions/orchestrator";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

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
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = submitAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureDemoUser();
  const quiz = await db.quiz.findUnique({
    where: { id },
    include: { questions: true },
  });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const questionMap = new Map(quiz.questions.map((q: any) => [q.id, q]));
  let correct = 0;
  const questionAttempts = parsed.data.answers.map((answer: any) => {
    const question: any = questionMap.get(answer.questionId);
    const isCorrect = question ? question.correctIdx === answer.selectedIdx : false;
    if (isCorrect) correct += 1;
    return {
      questionId: answer.questionId,
      selectedIdx: answer.selectedIdx,
      responseMs: answer.responseMs,
      isCorrect,
    };
  });

  const score = quiz.questions.length === 0 ? 0 : correct / quiz.questions.length;

  const attempt = await db.quizAttempt.create({
    data: {
      userId: user.id,
      quizId: quiz.id,
      score,
      durationSec: parsed.data.durationSec,
      questionAttempts: {
        create: questionAttempts,
      },
    },
    include: { questionAttempts: true },
  });

  await db.passiveSignalEvent.create({
    data: {
      userId: user.id,
      type: "QUIZ_SUBMIT",
      meta: { quizId: quiz.id, score } as any,
    },
  });

  const cycle = await runInterventionCycle(user.id);
  return NextResponse.json({ attempt, assessment: cycle.assessment, intervention: cycle.intervention });
}
