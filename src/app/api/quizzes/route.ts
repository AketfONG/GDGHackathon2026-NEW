import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { verifyRequestToken } from "@/lib/auth/verify-token";

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

export async function GET(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const quizzes = await QuizModel.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();
  const body = await req.json();
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const quiz = await QuizModel.create({
    title: parsed.data.title,
    topic: parsed.data.topic,
    difficulty: parsed.data.difficulty,
    questions: parsed.data.questions,
  });

  return NextResponse.json({ quiz: quiz.toObject() }, { status: 201 });
}
