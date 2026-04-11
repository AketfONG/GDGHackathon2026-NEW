import { NextRequest, NextResponse } from "next/server";
import {
  generateMCQsFromContent,
  validateReplicateConfig,
  type MCQuestion,
} from "@/lib/ai/replicate-service";
import { parseDocumentWithDocling } from "@/lib/ai/docling-service";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";

/** One cold test length; split evenly across all uploaded files for this request. */
function totalColdQuestionsTarget(): number {
  const n = parseInt(process.env.MCQ_COLD_TOTAL_QUESTIONS || "10", 10);
  return Number.isFinite(n) && n >= 4 ? Math.min(n, 30) : 10;
}

export const maxDuration = 300;

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "ppt", "pptx", "txt", "md"]);

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** e.g. 10 questions, 3 files → [4, 3, 3] */
function allocateQuestionSlots(total: number, bucketCount: number): number[] {
  if (bucketCount <= 0) return [];
  const base = Math.floor(total / bucketCount);
  const remainder = total % bucketCount;
  return Array.from({ length: bucketCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Alternate questions from each file so the quiz mixes sources evenly (A1, B1, A2, B2, …). */
function interleaveQuestionBatches(batches: MCQuestion[][]): MCQuestion[] {
  const maxLen = Math.max(0, ...batches.map((b) => b.length));
  const out: MCQuestion[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      if (i < batch.length) out.push(batch[i]!);
    }
  }
  return out;
}

function mapMcqToQuizRows(questions: MCQuestion[]) {
  return questions
    .map((q) => {
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
        topic: q.topic ?? "",
      };
    })
    .filter((row) => row.prompt.length > 0);
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
    const rawFiles = formData.getAll("file").filter((e): e is File => e instanceof File && e.size > 0);
    const course = String(formData.get("course") ?? "").trim();
    const week = String(formData.get("week") ?? "").trim();

    if (!rawFiles.length) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!course || !week) {
      return NextResponse.json(
        { success: false, error: "Course and week are required" },
        { status: 400 }
      );
    }

    const auth = await verifyRequestToken(req);
    if (!auth.ok) return auth.response;

    const quizScope = req.cookies.get(QUIZ_CLIENT_SCOPE_COOKIE)?.value?.trim();
    if (!quizScope) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Open Upload Materials or Quizzes once in this browser, then try again (session cookie missing).",
        },
        { status: 400 }
      );
    }

    const maxSizeBytes = (parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50") || 50) * 1024 * 1024;
    for (const file of rawFiles) {
      const ext = extensionOf(file.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name}: unsupported type (.${ext}). Use PDF, Word, PowerPoint, TXT, or Markdown.`,
          },
          { status: 400 }
        );
      }
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name}: exceeds ${process.env.MAX_UPLOAD_SIZE_MB || "50"}MB limit`,
          },
          { status: 413 }
        );
      }
    }

    const totalTarget = totalColdQuestionsTarget();
    const perFileCounts = allocateQuestionSlots(totalTarget, rawFiles.length);
    const cfg = replicateConfig as { apiToken: string; model?: string };

    const batches: MCQuestion[][] = [];

    for (let fi = 0; fi < rawFiles.length; fi++) {
      const file = rawFiles[fi]!;
      const want = perFileCounts[fi] ?? 0;
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
            error: `${file.name}: ${
              textBody.startsWith("[Document parse failed:")
                ? "Could not read this file. For Word/PowerPoint use .docx/.pptx; or export PDF; or upload .txt / .md."
                : fromBracket
            }`,
          },
          { status: 422 }
        );
      }

      const generated = await generateMCQsFromContent(
        parsed.markdown,
        course,
        want,
        cfg,
        { sourceFileName: file.name }
      );

      if (!generated.length) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name}: No questions were generated from this file`,
          },
          { status: 422 }
        );
      }

      batches.push(generated);
    }

    const merged = interleaveQuestionBatches(batches);
    const mappedQuestions = mapMcqToQuizRows(merged);

    if (!mappedQuestions.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid questions were produced after combining files. Try again.",
        },
        { status: 422 }
      );
    }

    await connectToDatabase();

    const title =
      rawFiles.length > 1
        ? `${course} - Week ${week}: Cold Test (${rawFiles.length} materials)`
        : `${course} - Week ${week}: Cold Test`;

    const quiz = await QuizModel.create({
      title,
      topic: course,
      difficulty: "mixed",
      course,
      week,
      testType: "cold" as const,
      createdFromUpload: true,
      ownerUserId: auth.user._id,
      quizClientScope: quizScope,
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
        sourceFileCount: rawFiles.length,
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
