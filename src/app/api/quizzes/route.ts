import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

const createQuizSchema = z.object({
  title: z.string().min(3),
  topic: z.string().min(2),
  difficulty: z.string().min(2),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(3),
        options: z.array(z.string().min(1)).min(2),
        correctIdx: z.number().int().min(0),
        explanation: z.string().optional(),
      }),
    )
    .min(1),
});

export async function GET() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const quizzes = await db.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: { questions: true },
  });
  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const body = await req.json();
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const quiz = await db.quiz.create({
    data: {
      title: parsed.data.title,
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty,
      questions: { create: parsed.data.questions },
    },
    include: { questions: true },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
