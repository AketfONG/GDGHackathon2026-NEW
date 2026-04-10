import { NextRequest, NextResponse } from "next/server";
import { generateMCQsFromContent, validateReplicateConfig } from "@/lib/ai/replicate-service";
import { parseDocumentWithDocling } from "@/lib/ai/docling-service";

/**
 * POST /api/quizzes/generate-from-document
 *
 * Accepts an uploaded document (PDF/PPT/Word) and generates MCQs using:
 * - Docling for document parsing → Markdown conversion
 * - Qwen2.5-VL-72B for multimodal MCQ generation
 *
 * Request: multipart/form-data with file
 * Response: { success: boolean; questions?: Question[]; error?: string }
 */

// Increase timeout for this endpoint (AI generation can take time)
export const maxDuration = 120;

interface ParsedDocument {
  markdown: string;
  images: Array<{ base64: string; description: string }>;
  title: string;
}

interface MCQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export async function POST(req: NextRequest) {
  try {
    // Validate Replicate API configuration
    const replicateConfig = {
      apiToken: process.env.REPLICATE_API_TOKEN,
      model: process.env.REPLICATE_GEMINI_MODEL,
    };

    const validation = validateReplicateConfig(replicateConfig);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const topic = (formData.get("topic") as string) || "General";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload PDF, Word, or PowerPoint files." },
        { status: 400 }
      );
    }

    // Check file size
    const maxSizeBytes = (parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50") || 50) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File size exceeds limit of ${process.env.MAX_UPLOAD_SIZE_MB || 50}MB` 
        },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Parse document with Docling
    const parsedDoc = await parseDocumentWithDocling(fileBuffer, file.name);

    // Generate MCQs with Replicate API (Gemini 3 Flash)
    const questions = await generateMCQsFromContent(
      parsedDoc.markdown,
      topic,
      10,
      replicateConfig as { apiToken: string; model?: string },
      { sourceFileName: file.name }
    );

    return NextResponse.json({
      success: true,
      questions,
      document: {
        title: parsedDoc.metadata.title,
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error("Error generating MCQs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate MCQs",
      },
      { status: 500 }
    );
  }
}
