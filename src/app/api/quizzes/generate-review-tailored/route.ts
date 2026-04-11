import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { getTopWeakTopics } from "@/lib/weak-area-analyzer";
import { generateMCQsFromContent, validateReplicateConfig, type MCQuestion } from "@/lib/ai/replicate-service";
import { isBackendDisabled, backendDisabledResponse } from "@/lib/backend-toggle";

/**
 * POST /api/quizzes/generate-review-tailored
 *
 * Analyzes student's weak areas in a course/week and generates
 * unlimited tailored review questions targeting those topics.
 *
 * Request: { course, week, questionCount }
 * Response: { success, questions?: MCQuestion[], weakTopics?: string[], error?: string }
 */

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();

  try {
    const auth = await verifyRequestToken(req);
    if (!auth.ok) return auth.response;

    await connectToDatabase();

    const body = await req.json();
    const course = String(body.course ?? "").trim();
    const week = String(body.week ?? "").trim();
    const questionCount = Math.min(Math.max(parseInt(body.questionCount ?? "10"), 5), 30);

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course is required" },
        { status: 400 }
      );
    }

    // Analyze weak topics (week is optional - analyzes all weeks if not specified)
    const weakTopics = await getTopWeakTopics(auth.user._id, course, week || undefined, 3);

    const replicateConfig = {
      apiToken: process.env.REPLICATE_API_TOKEN,
      model: process.env.REPLICATE_GEMINI_MODEL,
    };

    const validation = validateReplicateConfig(replicateConfig);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Generate tailored prompt for weak topics
    const topicsStr = weakTopics.join(", ");
    const prompt = `Generate ${questionCount} multiple-choice questions for a ${course} review session.
The student has struggled with these topics: ${topicsStr}

Focus on testing understanding of these weak areas. Questions should:
- Target the topics where the student is struggling
- Be at medium difficulty (not too easy, not too hard)
- Test conceptual understanding, not just facts
- Include clear explanations

Generate questions that would help the student practice and master these weak topics.

Format as JSON array only:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Brief explanation tied to the topic",
    "difficulty": "medium",
    "topic": "Topic name"
  }
]`;

    const cfg = replicateConfig as { apiToken: string; model?: string };

    // Generate questions using Replicate
    const questions: MCQuestion[] = [];
    
    // Call AI to generate questions based on weak topics
    try {
      const generatedQuestions = await generateMCQsFromContent(
        prompt,
        `${course} Review - ${topicsStr}`,
        questionCount,
        cfg,
        { sourceFileName: `${course}-week-${week}-review.txt` }
      );

      questions.push(...generatedQuestions);
    } catch (error) {
      // Fallback: if generation fails, return what we have
      console.error("Error generating tailored questions:", error);
      if (questions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Could not generate review questions. Try again later.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      questions: questions.slice(0, questionCount),
      weakTopics,
      message: `Generated ${questions.length} questions targeting: ${topicsStr}`,
    });
  } catch (error) {
    console.error("generate-review-tailored error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate review questions",
      },
      { status: 500 }
    );
  }
}
