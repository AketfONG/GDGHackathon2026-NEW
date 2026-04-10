import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";

export const maxDuration = 60;

interface SaveQuizRequest {
  course: string;
  week: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    difficulty: string;
    topic: string;
  }>;
  testType: "cold" | "hot" | "review";
}

export async function POST(request: NextRequest) {
  try {
    if (isBackendDisabled()) {
      return NextResponse.json(
        { success: false, error: "Backend is disabled" },
        { status: 503 }
      );
    }

    const auth = await verifyRequestToken(request);
    if (!auth.ok) return auth.response;

    const quizScope = request.cookies.get(QUIZ_CLIENT_SCOPE_COOKIE)?.value?.trim();
    if (!quizScope) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Open Upload or Quizzes in this browser first, then try again (session cookie missing).",
        },
        { status: 400 }
      );
    }

    const body: SaveQuizRequest = await request.json();
    const { course, week, questions, testType } = body;

    if (!course || !week || !questions || !testType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Create title based on course, week, and testType
    const testTypeLabel = {
      cold: "Cold Test",
      hot: "Hot Test",
      review: "Review Test",
    }[testType];

    const title = `${course} - Week ${week}: ${testTypeLabel}`;

    // Map questions to MongoDB format (prompt is required in schema)
    const mappedQuestions = questions
      .map((q) => ({
        prompt: String(q.question ?? "").trim(),
        options: q.options,
        correctIdx: q.correctAnswerIndex,
        explanation: q.explanation,
      }))
      .filter((row) => row.prompt.length > 0);

    if (!mappedQuestions.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid questions: each item needs non-empty question text.",
        },
        { status: 400 }
      );
    }

    // Create and save quiz
    const quiz = await QuizModel.create({
      title,
      topic: questions[0]?.topic || course,
      difficulty: "mixed",
      course,
      week,
      testType,
      createdFromUpload: testType === "cold",
      ownerUserId: auth.user._id,
      quizClientScope: quizScope,
      questions: mappedQuestions,
    });

    return NextResponse.json({
      success: true,
      message: "Quiz saved successfully",
      quiz: {
        id: quiz._id.toString(),
        title: quiz.title,
        course,
        week,
        testType,
        questionCount: mappedQuestions.length,
      },
    });
  } catch (error) {
    console.error("Error saving quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save quiz",
      },
      { status: 500 }
    );
  }
}
