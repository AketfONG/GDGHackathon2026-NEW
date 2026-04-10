/**
 * Service for generating MCQs using Replicate API
 * Supports Gemini 3 Flash and other LLMs
 *
 * API: https://replicate.com/
 * Model: google/gemini-3-flash (or other models)
 */

export interface MCQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export interface ReplicateConfig {
  apiToken: string;
  model?: string;
}

const DEFAULT_MODEL = "google/gemini-3-flash";
const MAX_POLL_ATTEMPTS = 60; // 5 minutes with 5-second intervals
const POLL_INTERVAL = 5000; // 5 seconds

async function pollPrediction(
  predictionId: string,
  apiToken: string
): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === "succeeded") {
      if (Array.isArray(data.output)) {
        return data.output.join("");
      }
      return data.output || "";
    }

    if (data.status === "failed") {
      throw new Error(`Prediction failed: ${data.error}`);
    }
  }

  throw new Error("Prediction polling timed out after 5 minutes");
}

async function callReplicateAPI(
  prompt: string,
  config: ReplicateConfig
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: prompt,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `API error (${response.status}): ${error.detail || error.error || "Unknown error"}`
      );
    }

    const data = await response.json();
    const predictionId = data.id;

    if (!predictionId) {
      throw new Error("No prediction ID returned from API");
    }

    // Poll for completion
    return await pollPrediction(predictionId, config.apiToken);
  } catch (error) {
    throw error;
  }
}

export type GenerateMCQsOptions = {
  /** Original filename; included in the prompt so the model knows the source document. */
  sourceFileName?: string;
};

function maxSourceCharsForPrompt(): number {
  const n = parseInt(process.env.MCQ_PROMPT_MAX_CHARS || "16000", 10);
  return Number.isFinite(n) && n >= 2000 ? Math.min(n, 100000) : 16000;
}

/**
 * Keep only substantive body text for the model. Removes filename-as-title lines,
 * "Document: …" stubs, and bracketed system messages so questions target ideas, not file metadata.
 */
function contentForMcqPrompt(raw: string): string {
  let s = raw.trim();
  // Leading markdown H1 (our pipeline uses `# filename.pdf`)
  if (s.startsWith("#")) {
    const nl = s.indexOf("\n");
    s = nl === -1 ? "" : s.slice(nl + 1).trim();
  }
  // Legacy placeholder header
  s = s.replace(/^Document:\s*[^\n]+\n*/i, "").trim();
  // Drop bracketed helper / error lines (whole line)
  s = s
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t === "") return true;
      if (/^\[No selectable text found/i.test(t)) return false;
      if (/^\[Document parse failed:/i.test(t)) return false;
      if (/^\[Legacy \.(doc|ppt)\b/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
  return s;
}

type RawMcqBlob = {
  question: string;
  options: string[];
  explanation: string;
};

/** LLMs sometimes omit `question` or use alternate keys; empty stems break Mongoose `prompt` required. */
function readQuestionStem(q: Record<string, unknown>): string {
  const candidates = [q.question, q.prompt, q.stem, q.text, q.q];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return "";
}

/**
 * Drop questions that are about the file as an object (name, format, pages, upload)
 * rather than the subject matter.
 */
function questionSmellsLikeFileMetadata(
  q: RawMcqBlob,
  sourceFileName?: string
): boolean {
  const blob = [q.question, ...q.options, q.explanation].join(" ");

  // Do not scan options/explanation for ".txt" / ".md" — course material often mentions them and
  // would cause every question to be dropped. Extension-in-question checks are below (stem only).
  const patterns: RegExp[] = [
    /\b(file extension|file format|file name|filename|mime type|mime)\b/i,
    /\b(how many pages|number of pages|page count)\b/i,
    /\b(uploaded file|uploaded document|the upload|when you upload|after uploading)\b/i,
    /\b(this pdf|this docx|this powerpoint|this word document|the pdf file|the document file)\b/i,
    /\b(digital file|binary file|file size|file properties)\b/i,
    /\bwhat (is|are) the (name|type|format|extension)\b/i,
    /\bwhich (file|format|type of file)\b/i,
  ];

  for (const re of patterns) {
    if (re.test(blob)) return true;
  }

  const stem = q.question;
  if (
    /\.(pdf|docx?|pptx?)\b/i.test(stem) &&
    /\b(which|what|how|name|type|format|extension|file)\b/i.test(stem)
  ) {
    return true;
  }

  const base = sourceFileName?.replace(/\.[^./\\]+$/i, "").trim().toLowerCase() ?? "";
  if (base.length >= 4) {
    const lower = blob.toLowerCase();
    if (lower.includes(base)) {
      const fileish =
        /\b(file|document|pdf|upload|attachment|saved as|named)\b/i.test(stem) ||
        /\b(which|what) (file|document|name)\b/i.test(stem);
      if (fileish) return true;
    }
  }

  return false;
}

export async function generateMCQsFromContent(
  content: string,
  topic: string,
  numQuestions: number = 10,
  config: ReplicateConfig,
  options?: GenerateMCQsOptions
): Promise<MCQuestion[]> {
  const bodyOnly = contentForMcqPrompt(content);
  const maxChars = maxSourceCharsForPrompt();
  const excerpt = bodyOnly.slice(0, maxChars);
  const sourceLabel = options?.sourceFileName?.trim() || "upload";

  const prompt = `You write multiple-choice questions for the course subject: "${topic}".

The block below is labeled SUBJECT-MATTER TEXT. It is the actual words and ideas from the student's reading material (body text only). A technical note for you (do NOT quiz on this): it was ingested from "${sourceLabel}" — you must completely ignore file names, extensions, MIME types, byte size, number of pages, PDF/Word/PowerPoint structure, fonts, metadata, or any property of "a file" as an object.

ABSOLUTE BANS:
- Do NOT ask what the document is called, what format it is, how many pages it has, or anything about uploading or files.
- Do NOT ask about titles, headings, or filenames that appear only because of how the text was packaged.
- ONLY ask about concepts, facts, definitions, procedures, examples, and arguments that appear in the SUBJECT-MATTER TEXT itself.

STRICT RULES:
1. Every question MUST be answerable only from the SUBJECT-MATTER TEXT below. No outside knowledge.
2. Correct answers MUST match the text. Wrong options must be plausible but contradicted by or unsupported by the text; prefer distractors built from other phrases in the same text.
3. If the text is short or messy, stay on its actual vocabulary and ideas — do not switch to generic trivia.
4. Each explanation must cite what in the text supports the correct answer (short paraphrase or quote).

Generate exactly ${numQuestions} questions about the SUBJECT MATTER only.

SUBJECT-MATTER TEXT (may be truncated; this is what students learned from — not metadata):
---
${excerpt}
---

For each question, provide:
1. A question that tests understanding of the content above (never the file)
2. Four distinct options (A, B, C, D)
3. Correct answer letter per the text
4. Explanation tied to the text
5. Difficulty: easy, medium, or hard

Format the response as a VALID JSON array ONLY. No markdown fences, no commentary outside the array.
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Explanation text",
    "difficulty": "medium",
    "topic": "${topic}"
  }
]`;

  try {
    let response = await callReplicateAPI(prompt, config);

    // Clean up response - remove markdown code blocks if present
    response = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to find JSON array in response
    let jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
    
    if (!jsonMatch) {
      // Try to find just the array start and end
      const startIdx = response.indexOf("[");
      const endIdx = response.lastIndexOf("]");
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonMatch = [response.substring(startIdx, endIdx + 1)];
      }
    }

    if (!jsonMatch) {
      console.error("Response was:", response);
      throw new Error(
        "Could not find JSON array in response. Response may not be properly formatted."
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array of questions");
    }

    const asBlobs: RawMcqBlob[] = questions.map((q: any) => ({
      question: readQuestionStem(q),
      options: (q.options ?? []).map((o: unknown) => String(o)),
      explanation: String(q.explanation ?? ""),
    }));

    const kept = questions.filter(
      (_q: unknown, i: number) =>
        !questionSmellsLikeFileMetadata(asBlobs[i]!, options?.sourceFileName)
    );

    if (kept.length === 0 && questions.length > 0) {
      throw new Error(
        "The model only produced file-related questions (name, format, pages, etc.). Try again or use a longer reading extract."
      );
    }

    if (kept.length < questions.length) {
      console.warn(
        `[generateMCQsFromContent] Dropped ${questions.length - kept.length} question(s) that referenced file metadata.`
      );
    }

    // Map correctAnswer to correctAnswerIndex; drop rows with no usable stem (avoids Quiz validation errors).
    const mapped: MCQuestion[] = kept.map((q: any) => {
      const stem = readQuestionStem(q);
      const options = (q.options || []).map((o: any) => String(o));
      const letter = String(q.correctAnswer || "A").toUpperCase().charAt(0);
      return {
        question: stem,
        options,
        correctAnswer: letter,
        correctAnswerIndex: letter.charCodeAt(0) - 65,
        explanation: String(q.explanation ?? "") || "No explanation provided",
        difficulty: (q.difficulty || "medium").toLowerCase() as
          | "easy"
          | "medium"
          | "hard",
        topic: String(q.topic ?? topic) || topic,
      };
    });

    const valid = mapped.filter(
      (q) => q.question.length > 0 && q.options.filter((o) => o.trim()).length >= 2
    );

    if (valid.length < mapped.length) {
      console.warn(
        `[generateMCQsFromContent] Dropped ${mapped.length - valid.length} question(s) with empty or invalid stem/options.`
      );
    }

    return valid;
  } catch (error) {
    console.error("Error generating MCQs:", error);
    throw error;
  }
}

export function validateReplicateConfig(
  config: Partial<ReplicateConfig>
): { valid: boolean; error?: string } {
  if (!config.apiToken) {
    return {
      valid: false,
      error: "API token not configured. Check your environment variables.",
    };
  }

  return { valid: true };
}
