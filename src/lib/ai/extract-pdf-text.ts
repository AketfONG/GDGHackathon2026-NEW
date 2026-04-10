import { PDFParse } from "pdf-parse";

/**
 * Extract human-readable text from a PDF buffer using pdf.js (via pdf-parse v2).
 * Scanned/image-only PDFs may return little or no text.
 */
export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = (result.text ?? "")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    const pages =
      typeof result.total === "number" && result.total > 0
        ? result.total
        : Math.max(1, result.pages?.length ?? 1);
    return { text, pages };
  } finally {
    await parser.destroy().catch(() => {});
  }
}
