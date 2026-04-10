import { NextRequest, NextResponse } from "next/server";
import { generateMCQsFromContent, validateReplicateConfig } from "@/lib/ai/replicate-service";
import { parseDocumentWithDocling } from "@/lib/ai/docling-service";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { isBackendDisabled } from "@/lib/backend-toggle";

export const maxDuration = 120;

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "ppt", "pptx", "txt", "md"]);

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(req: NextRequest) {
  try {
    if (isBackendDisabled()) {
      return NextResponse.json(
        { success: false, error: "Backend is disabled" },
        { status: 503 }
      );
    }

    const replicateConfig = {
      apiToken: process.env.REPLICATE_API_TOKEN,
      model: process.env.REPLICATE_GEMINI_MODEL,
    };

    const validation = validateReplicateConfig(replicateConfig);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error ?? "Replicate API not configured" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const course = String(formData.get("course") ?? "").trim();
    const week = String(formData.get("week") ?? "").trim();

    if (!file?.size) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!course || !week) {
      return NextResponse.json(
        { success: false, error: "Course and week are required" },
        { status: 400 }
      );
    }

    const ext = extensionOf(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type (.${ext}). Use PDF, Word, PowerPoint, TXT, or Markdown.`,
        },
        { status: 400 }
      );
    }

    const maxSizeBytes = (parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50") || 50) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds limit of ${process.env.MAX_UPLOAD_SIZE_MB || 50}MB`,
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocumentWithDocling(buffer, file.name);

    const textBody = parsed.markdown.replace(/^#\s*[^\n]+\n+/, "").trim();
    const bracketError =
      textBody.startsWith("[No selectable text found") ||
      textBody.startsWith("[Document parse failed:") ||
      textBody.startsWith("[Legacy .doc") ||
      textBody.startsWith("[Legacy .ppt");
    if (bracketError) {
      const fromBracket =
        textBody.startsWith("[") && textBody.endsWith("]")
          ? textBody.slice(1, -1)
          : textBody;
      return NextResponse.json(
        {
          success: false,
          error: textBody.startsWith("[Document parse failed:")
            ? "Could not read this file. For Word/PowerPoint use .docx/.pptx; or export PDF; or upload .txt / .md."
            : fromBracket,
        },
        { status: 422 }
      );
    }

    const questions = await generateMCQsFromContent(
      parsed.markdown,
      course,
      10,
      replicateConfig as { apiToken: string; model?: string },
      { sourceFileName: file.name }
    );

    if (!questions.length) {
      return NextResponse.json(
        { success: false, error: "No questions were generated from this file" },
        { status: 422 }
      );
    }

    const mappedQuestions = questions.map((q) => {
      const options = (q.options ?? []).map((o) => String(o));
      let correctIdx = Number.isFinite(q.correctAnswerIndex) ? q.correctAnswerIndex : 0;
      if (correctIdx < 0 || correctIdx >= options.length) {
        correctIdx = 0;
      }
      const prompt = String(q.question ?? "").trim();
      return {
        prompt,
        options: options.length >= 2 ? options : ["A", "B", "C", "D"],
        correctIdx,
        explanation: q.explanation ?? "",
      };
    }).filter((row) => row.prompt.length > 0);

    if (!mappedQuestions.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid questions were generated (every item was missing question text). Try again.",
        },
        { status: 422 }
      );
    }

    await connectToDatabase();

    const title = `${course} - Week ${week}: Cold Test`;
    const quiz = await QuizModel.create({
      title,
      topic: course,
      difficulty: "mixed",
      course,
      week,
      testType: "cold" as const,
      questions: mappedQuestions,
    });

    return NextResponse.json({
      success: true,
      quiz: {
        id: String(quiz._id),
        title: quiz.title,
        course,
        week,
        testType: "cold",
        questionCount: mappedQuestions.length,
      },
    });
  } catch (error) {
    console.error("upload-generate-cold:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate cold test",
      },
      { status: 500 }
    );
  }
}
