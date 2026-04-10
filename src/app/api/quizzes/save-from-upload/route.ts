import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { isBackendDisabled } from "@/lib/backend-toggle";

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

export async function POST(request: Request) {
  try {
    if (isBackendDisabled()) {
      return Response.json(
        { success: false, error: "Backend is disabled" },
        { status: 503 }
      );
    }

    const body: SaveQuizRequest = await request.json();
    const { course, week, questions, testType } = body;

    if (!course || !week || !questions || !testType) {
      return Response.json(
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
      return Response.json(
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
      questions: mappedQuestions,
    });

    return Response.json({
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
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save quiz",
      },
      { status: 500 }
    );
  }
}
