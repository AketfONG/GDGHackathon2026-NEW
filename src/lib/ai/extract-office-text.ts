import JSZip from "jszip";
import mammoth from "mammoth";

/** Plain text from a .docx (Office Open XML) file. */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return (value || "").replace(/\s+/g, " ").trim();
}

/** Plain text from a .pptx deck (slide XML text runs). */
export async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => {
      const na = parseInt(/\d+/.exec(a)?.[0] ?? "0", 10);
      const nb = parseInt(/\d+/.exec(b)?.[0] ?? "0", 10);
      return na - nb;
    });

  const slides: string[] = [];
  for (const path of slidePaths) {
    const entry = zip.file(path);
    if (!entry) continue;
    const xml = await entry.async("string");
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/gi)].map((m) => (m[1] ?? "").trim());
    const line = runs.filter(Boolean).join(" ");
    if (line) slides.push(line);
  }

  return slides.join("\n\n").replace(/\s+/g, " ").trim();
}
