export type UiQuestionMedia = {
  kind: "image" | "diagram";
  src: string;
  alt: string;
};

export type UiQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  media?: UiQuestionMedia;
};

export type UiQuiz = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  questions: UiQuizQuestion[];
};

function makeDiagramDataUri(label: string) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect x="1" y="1" width="318" height="178" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
  <rect x="20" y="28" width="80" height="28" rx="4" fill="#dbeafe" stroke="#93c5fd" />
  <rect x="120" y="28" width="80" height="28" rx="4" fill="#dcfce7" stroke="#86efac" />
  <rect x="220" y="28" width="80" height="28" rx="4" fill="#fee2e2" stroke="#fca5a5" />
  <line x1="100" y1="42" x2="120" y2="42" stroke="#64748b" stroke-width="2" />
  <line x1="200" y1="42" x2="220" y2="42" stroke="#64748b" stroke-width="2" />
  <text x="20" y="95" fill="#334155" font-family="Arial, sans-serif" font-size="14">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const uiOnlyQuizzes: UiQuiz[] = [
  {
    id: "ui-quiz-1",
    title: "DSA Fundamentals",
    topic: "Data Structures",
    difficulty: "EASY",
    questions: Array.from({ length: 10 }, (_, idx) => {
      const qNumber = idx + 1;
      const media: UiQuestionMedia | undefined =
        qNumber % 2 === 0
          ? {
              kind: qNumber % 4 === 0 ? "image" : "diagram",
              src: makeDiagramDataUri(`Sample visual for question ${qNumber}`),
              alt: `Reference visual for question ${qNumber}`,
            }
          : undefined;
      return {
        id: `ui-quiz-1-q-${qNumber}`,
        prompt: `Sample DSA question ${qNumber}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIdx: qNumber % 4,
        explanation: `Question ${qNumber}: This is a sample explanation shown in review mode, regardless of correctness.`,
        media,
      };
    }),
  },
];

export function getUiQuizById(id: string) {
  return uiOnlyQuizzes.find((quiz) => quiz.id === id);
}
