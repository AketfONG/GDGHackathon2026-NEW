import { NextRequest, NextResponse } from "next/server";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { getTopWeakTopics, getUnclearConcepts } from "@/lib/weak-area-analyzer";
import { generateMCQsFromContent, validateReplicateConfig, type MCQuestion } from "@/lib/ai/replicate-service";
import { isBackendDisabled, backendDisabledResponse } from "@/lib/backend-toggle";
import { QuizModel } from "@/models/Quiz";

/**
 * POST /api/quizzes/generate-review-tailored
 *
 * Analyzes student's weak areas in an uploaded cold quiz
 * and generates unlimited tailored review questions targeting those topics.
 *
 * Request: { course, week?, questionCount? }
 * Response: { success, questions?: MCQuestion[], weakTopics?: string[], sourceQuizTitle?: string, error?: string }
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

    // Find the uploaded cold quiz for this course (case-insensitive)
    const sourceQuiz = await QuizModel.findOne({
      course: { $regex: `^${course}$`, $options: "i" },
      testType: "cold",
      createdFromUpload: true,
      ownerUserId: auth.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!sourceQuiz) {
      return NextResponse.json(
        {
          success: false,
          error: `No uploaded quiz found for ${course}. Complete a cold test first.`,
        },
        { status: 404 }
      );
    }

    // Analyze weak topics from this specific quiz
    const weakTopics = await getTopWeakTopics(auth.user._id, course, week || undefined, 3);
    
    // Get specific unclear concepts from failed questions
    const unclearConcepts = await getUnclearConcepts(auth.user._id, course, week || undefined, 3);

    // Get the questions from the source quiz to use as context
    const sourceQuestions = (sourceQuiz.questions ?? []) as Array<{
      prompt: string;
      topic?: string;
    }>;
    const sourceContent = sourceQuestions
      .map((q, i) => `${i + 1}. [${q.topic || "General"}] ${q.prompt}`)
      .join("\n");

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

    // Generate tailored prompt using actual source quiz content
    const topicsStr = weakTopics.join(", ");
    console.log(`[generate-review-tailored] Generating ${questionCount} questions for weak topics:`, topicsStr);
    console.log(`[generate-review-tailored] Source quiz has ${sourceQuestions.length} questions`);
    const prompt = `Generate ${questionCount} new multiple-choice questions for ${course} review.

STUDENT'S WEAK AREAS: ${topicsStr}

The student took this quiz and struggled with the topics listed above. Generate NEW questions (not copies) that test understanding of these weak areas.

IMPORTANT: Base questions on the same course material concepts, not random topics.
- Focus on the topics where the student is struggling
- Questions should be at medium difficulty
- Test conceptual understanding
- Include clear explanations
- Use the same topic categories as shown below

SOURCE QUIZ TOPICS (for reference):
${sourceContent.slice(0, 2000)}

Format as JSON array only:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Brief explanation",
    "difficulty": "medium",
    "topic": "Topic name"
  }
]`;

    const cfg = replicateConfig as { apiToken: string; model?: string };

    // Generate questions using Replicate
    const questions: MCQuestion[] = [];

    try {
      console.log(`[generate-review-tailored] Starting AI question generation...`);
      const generatedQuestions = await generateMCQsFromContent(
        prompt,
        `${course} Review - ${topicsStr}`,
        questionCount,
        cfg,
        { sourceFileName: `${sourceQuiz.title}.txt` }
      );
      console.log(`[generate-review-tailored] AI generated ${generatedQuestions.length} new questions`);
      if (generatedQuestions.length > 0) {
        console.log(`[generate-review-tailored] First generated question preview:`, generatedQuestions[0].question.substring(0, 80));
        // Verify they're different from source
        const srcPrompts = new Set(sourceQuestions.map(q => q.prompt.substring(0, 50)));
        const newCount = generatedQuestions.filter(q => {
          const preview = q.question.substring(0, 50);
          return !srcPrompts.has(preview);
        }).length;
        console.log(`[generate-review-tailored] Verified ${newCount}/${generatedQuestions.length} are new (not duplicates from source)`);
      }

      questions.push(...generatedQuestions);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error generating tailored questions:", errorMsg);
      if (questions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Could not generate review questions: ${errorMsg.slice(0, 100)}`,
          },
          { status: 500 }
        );
      }
    }

    console.log(`[generate-review-tailored] ✅ Returning ${questions.length} new questions`);
    console.log(`[generate-review-tailored] Weak topics targeted:`, topicsStr);
    console.log(`[generate-review-tailored] Unclear concepts identified:`, unclearConcepts);

    return NextResponse.json({
      success: true,
      questions: questions.slice(0, questionCount),
      weakTopics,
      unclearConcepts,
      sourceQuizTitle: sourceQuiz.title,
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
