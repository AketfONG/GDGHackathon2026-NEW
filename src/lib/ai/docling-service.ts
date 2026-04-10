/**
 * Service for parsing documents using Docling
 *
 * Docling converts PDFs, PowerPoints, and Word documents to clean Markdown
 * with structure preserves (tables, lists, formatting).
 *
 * Installation:
 * pip install docling
 *
 * Usage:
 * python docling_service.py --file document.pdf --output markdown/
 */

export interface DoclingConfig {
  apiEndpoint?: string; // If using Docling API instead of local
  maxFileSize?: number; // In MB
  supportedFormats?: string[];
}

const DEFAULT_CONFIG: DoclingConfig = {
  maxFileSize: 50,
  supportedFormats: ["pdf", "ppt", "pptx", "docx", "doc", "txt", "md"],
};

export async function parseDocumentWithDocling(
  fileBuffer: Buffer,
  fileName: string,
  config = DEFAULT_CONFIG
): Promise<{
  markdown: string;
  images: Array<{ base64: string; description: string }>;
  metadata: { title: string; pages: number };
}> {
  try {
    let extractedText = "";
    let pageCount = 1;

    const fileExt = fileName.split(".").pop()?.toLowerCase();

    const extractLimit = (() => {
      const n = parseInt(process.env.DOCUMENT_EXTRACT_MAX_CHARS || "16000", 10);
      return Number.isFinite(n) && n >= 1000 ? Math.min(n, 200000) : 16000;
    })();

    if (fileExt === "pdf") {
      const { extractPdfText } = await import("@/lib/ai/extract-pdf-text");
      const { text, pages } = await extractPdfText(fileBuffer);
      pageCount = pages;
      extractedText = text.substring(0, extractLimit);
    } else if (fileExt === "docx") {
      const { extractDocxText } = await import("@/lib/ai/extract-office-text");
      extractedText = (await extractDocxText(fileBuffer)).substring(0, extractLimit);
    } else if (fileExt === "pptx") {
      const { extractPptxText } = await import("@/lib/ai/extract-office-text");
      extractedText = (await extractPptxText(fileBuffer)).substring(0, extractLimit);
    } else if (fileExt === "doc") {
      extractedText =
        "[Legacy .doc (binary Word) is not supported. In Word use Save As → .docx or export PDF, then upload.]";
    } else if (fileExt === "ppt") {
      extractedText =
        "[Legacy .ppt (binary PowerPoint) is not supported. Save As → .pptx or export PDF, then upload.]";
    } else if (fileExt === "txt" || fileExt === "md") {
      let t = fileBuffer.toString("utf-8");
      if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
      extractedText = t.substring(0, extractLimit);
    } else {
      extractedText = fileBuffer.toString("utf-8").substring(0, extractLimit);
    }

    // PDFs with no text layer (scanned pages) — avoid fake placeholder that breaks quiz grounding
    if (!extractedText.trim()) {
      if (fileExt === "pdf") {
        extractedText =
          `[No selectable text found in this PDF (${fileName}). It may be scanned images only — use OCR or upload a text-based PDF, .txt, or .docx.]`;
      } else {
        extractedText = `Document: ${fileName}\n\n(No text could be extracted from this file.)`;
      }
    }

    return {
      markdown: `# ${fileName}\n\n${extractedText}`,
      images: [],
      metadata: {
        title: fileName.replace(/\.[^/.]+$/, ""),
        pages: pageCount,
      },
    };
  } catch (error) {
    console.error("Error parsing document:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return {
      markdown: `# ${fileName}\n\n[Document parse failed: ${msg}]`,
      images: [],
      metadata: {
        title: fileName.replace(/\.[^/.]+$/, ""),
        pages: 1,
      },
    };
  }
}

export function validateFileForDocling(file: File, config = DEFAULT_CONFIG): { valid: boolean; error?: string } {
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > (config.maxFileSize || 50)) {
    return { valid: false, error: `File size exceeds ${config.maxFileSize}MB limit` };
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!config.supportedFormats?.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported format. Please upload: ${config.supportedFormats?.join(", ")}`,
    };
  }

  return { valid: true };
}
