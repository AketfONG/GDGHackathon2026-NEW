import type { UiQuiz, UiQuizQuestion } from "@/lib/ui-quizzes";

const MATH2411_ID = "scheduled-math2411-hot";
const HUMA2104_ID = "scheduled-huma2104-hot";
const TEMG3950_ID = "scheduled-temg3950-review";

export const DEFAULT_SCHEDULED_QUIZ_IDS = [MATH2411_ID, HUMA2104_ID, TEMG3950_ID] as const;

export function isDefaultScheduledQuizId(id: string): boolean {
  return (DEFAULT_SCHEDULED_QUIZ_IDS as readonly string[]).includes(id);
}

function q(
  id: string,
  prompt: string,
  options: [string, string, string, string],
  correctIdx: 0 | 1 | 2 | 3,
  explanation: string,
): UiQuizQuestion {
  return {
    id,
    prompt,
    options: [...options],
    correctIdx,
    explanation,
  };
}

const math2411Questions: UiQuizQuestion[] = [
  q(
    `${MATH2411_ID}-1`,
    "A fair six-sided die is rolled once. What is the probability of rolling an even number?",
    ["1/6", "1/3", "1/2", "2/3"],
    2,
    "Even faces are 2, 4, and 6 — three outcomes out of six, so P = 3/6 = 1/2.",
  ),
  q(
    `${MATH2411_ID}-2`,
    "Two independent fair coins are flipped. What is the probability both show heads?",
    ["1/4", "1/3", "1/2", "1"],
    0,
    "P(HH) = P(H)×P(H) = (1/2)×(1/2) = 1/4.",
  ),
  q(
    `${MATH2411_ID}-3`,
    "If P(A) = 0.3 and P(B) = 0.4, and A and B are independent, what is P(A ∩ B)?",
    ["0.7", "0.12", "0.1", "0.34"],
    1,
    "For independent events, P(A ∩ B) = P(A)P(B) = 0.3 × 0.4 = 0.12.",
  ),
  q(
    `${MATH2411_ID}-4`,
    "The expected value of a fair die roll (1–6) is:",
    ["3", "3.5", "4", "21"],
    1,
    "E[X] = (1+2+3+4+5+6)/6 = 21/6 = 3.5.",
  ),
  q(
    `${MATH2411_ID}-5`,
    "In a standard deck of 52 cards, one card is drawn at random. What is the probability it is a heart?",
    ["1/52", "1/26", "1/13", "1/4"],
    3,
    "There are 13 hearts in 52 cards, so P = 13/52 = 1/4.",
  ),
  q(
    `${MATH2411_ID}-6`,
    "For events A and B, P(A ∪ B) equals P(A) + P(B) when:",
    ["A and B are always true", "A and B are mutually exclusive", "A and B are independent", "B is empty"],
    1,
    "If A ∩ B = ∅, then P(A ∪ B) = P(A) + P(B). Independence alone does not imply this.",
  ),
  q(
    `${MATH2411_ID}-7`,
    "A bag has 3 red and 2 blue marbles. You draw one without replacement, then another. What is P(both red)?",
    ["9/25", "3/10", "2/5", "1/2"],
    1,
    "P = (3/5)×(2/4) = 6/20 = 3/10.",
  ),
  q(
    `${MATH2411_ID}-8`,
    "The complement of an event E has probability:",
    ["P(E)", "1 − P(E)", "P(E)²", "0"],
    1,
    "P(E′) = 1 − P(E).",
  ),
  q(
    `${MATH2411_ID}-9`,
    "Which distribution models the number of successes in n independent Bernoulli trials with fixed success probability p?",
    ["Normal", "Poisson", "Binomial", "Uniform"],
    2,
    "The binomial distribution counts successes in n independent trials with constant p.",
  ),
  q(
    `${MATH2411_ID}-10`,
    "If X ~ Uniform(0, 1), what is P(0.2 ≤ X ≤ 0.5)?",
    ["0.2", "0.3", "0.5", "0.7"],
    1,
    "Length of interval is 0.5 − 0.2 = 0.3 on a total width 1, so P = 0.3.",
  ),
];

const huma2104Questions: UiQuizQuestion[] = [
  q(
    `${HUMA2104_ID}-1`,
    "How many beats does a whole note typically receive in 4/4 time?",
    ["1", "2", "4", "8"],
    2,
    "In common time (4/4), a whole note lasts four quarter-note beats.",
  ),
  q(
    `${HUMA2104_ID}-2`,
    "The interval from C up to G (same octave) is best described as:",
    ["A second", "A fourth", "A fifth", "An octave"],
    2,
    "C–D–E–F–G spans five letter names; C to G is a perfect fifth.",
  ),
  q(
    `${HUMA2104_ID}-3`,
    "A major scale follows the pattern of whole (W) and half (H) steps:",
    ["W-W-H-W-W-W-H", "W-H-W-W-H-W-W", "H-W-W-W-H-W-W", "W-W-W-W-H-H"],
    0,
    "Major scale: W W H W W W H between successive degrees.",
  ),
  q(
    `${HUMA2104_ID}-4`,
    "The triad built on the first degree of a major scale is called:",
    ["Dominant", "Subdominant", "Tonic", "Leading tone"],
    2,
    "Scale degree 1 is the tonic; its triad is the tonic chord.",
  ),
  q(
    `${HUMA2104_ID}-5`,
    "Which clef is most often used for higher-pitched instruments and the right hand in piano music?",
    ["Bass clef", "Alto clef", "Treble clef", "Percussion clef"],
    2,
    "The treble (G) clef notates higher registers.",
  ),
  q(
    `${HUMA2104_ID}-6`,
    "Tempo marking “allegro” generally indicates:",
    ["Very slow", "Moderate", "Fast", "As slow as possible"],
    2,
    "Allegro suggests a brisk, fast tempo.",
  ),
  q(
    `${HUMA2104_ID}-7`,
    "In a major key, the chord on scale degree V is typically:",
    ["Minor", "Major", "Diminished", "Augmented"],
    1,
    "The dominant (V) triad in major is major.",
  ),
  q(
    `${HUMA2104_ID}-8`,
    "A sharp (♯) raises a pitch by:",
    ["A whole step", "A half step", "An octave", "A third"],
    1,
    "Accidentals: sharp raises by one semitone (half step).",
  ),
  q(
    `${HUMA2104_ID}-9`,
    "Which pair are enharmonic equivalents (same pitch, different spelling)?",
    ["C and D", "F and G", "G♯ and A♭", "B and C"],
    2,
    "On a piano, G♯ and A♭ sound the same; they are enharmonic.",
  ),
  q(
    `${HUMA2104_ID}-10`,
    "The relative minor of C major is:",
    ["A minor", "E minor", "G minor", "D minor"],
    0,
    "A minor shares the same key signature as C major (no sharps/flats) and is its relative minor.",
  ),
];

const temg3950Questions: UiQuizQuestion[] = [
  q(
    `${TEMG3950_ID}-1`,
    "In structured case analysis, what should you establish before recommending solutions?",
    ["The company logo", "The core problem and decision criteria", "Only financial ratios", "Industry trivia"],
    1,
    "Frame the decision: clarify the problem, stakeholders, and what “success” means before options.",
  ),
  q(
    `${TEMG3950_ID}-2`,
    "Root cause analysis aims to find:",
    ["The most visible symptom", "Underlying causes, not only surface issues", "Who to blame", "The shortest report"],
    1,
    "RCA digs past symptoms to drivers you can actually address.",
  ),
  q(
    `${TEMG3950_ID}-3`,
    "A SWOT analysis categorizes factors into:",
    ["Legal, ethical, social, technical", "Strengths, weaknesses, opportunities, threats", "Cost, quality, time, scope", "Supply, demand, price, margin"],
    1,
    "SWOT = internal strengths/weaknesses and external opportunities/threats.",
  ),
  q(
    `${TEMG3950_ID}-4`,
    "When comparing strategic options, a useful practice is to:",
    ["Pick the first idea", "Use consistent criteria and evidence from the case", "Ignore constraints", "Focus only on marketing"],
    1,
    "Options should be evaluated against the same criteria tied to case facts.",
  ),
  q(
    `${TEMG3950_ID}-5`,
    "In case write-ups, recommendations should be:",
    ["Vague so any outcome fits", "Actionable and tied to analysis", "Copied from the internet", "Only a list of problems"],
    1,
    "Good recommendations follow logically from analysis and say what to do.",
  ),
  q(
    `${TEMG3950_ID}-6`,
    "The “5 Whys” technique is used to:",
    ["Count competitors", "Iterate on why a problem occurred to reach deeper causes", "Schedule meetings", "Estimate market size"],
    1,
    "Repeatedly asking “why?” helps trace a symptom to root causes.",
  ),
  q(
    `${TEMG3950_ID}-7`,
    "Stakeholder analysis in a case helps you:",
    ["Ignore people issues", "Understand interests, power, and impacts of decisions", "Replace financial analysis", "Shorten the executive summary only"],
    1,
    "Map who cares, how much power they have, and how options affect them.",
  ),
  q(
    `${TEMG3950_ID}-8`,
    "A risk in case recommendations is:",
    ["Citing evidence", "Ignoring implementation constraints", "Defining the problem", "Summarizing context"],
    1,
    "Plans that ignore resources, timing, or politics often fail in practice.",
  ),
  q(
    `${TEMG3950_ID}-9`,
    "When the case has conflicting data, you should:",
    ["Hide the conflict", "Note assumptions and weigh reliability of sources", "Always trust the largest number", "Skip analysis"],
    1,
    "Transparently state uncertainty and justify which evidence you privilege.",
  ),
  q(
    `${TEMG3950_ID}-10`,
    "An executive summary in case analysis should:",
    ["Be dozens of pages", "Give decision-makers the gist: problem, analysis, recommendation", "Only list references", "Repeat the appendix verbatim"],
    1,
    "Executives need a concise synthesis: what’s wrong, what you found, what to do.",
  ),
];

const byId: Record<string, UiQuiz> = {
  [MATH2411_ID]: {
    id: MATH2411_ID,
    title: "MATH2411 — Hot quiz",
    topic: "Probability",
    difficulty: "MEDIUM",
    questions: math2411Questions,
  },
  [HUMA2104_ID]: {
    id: HUMA2104_ID,
    title: "HUMA2104 — Hot quiz",
    topic: "Music theory",
    difficulty: "MEDIUM",
    questions: huma2104Questions,
  },
  [TEMG3950_ID]: {
    id: TEMG3950_ID,
    title: "TEMG3950 — Review",
    topic: "Case analysis",
    difficulty: "MEDIUM",
    questions: temg3950Questions,
  },
};

export function getDefaultScheduledUiQuiz(id: string): UiQuiz | null {
  return byId[id] ?? null;
}
