import type { UiQuiz, UiQuizQuestion } from "@/lib/ui-quizzes";

const MATH2411_ID = "scheduled-math2411-hot";
const HUMA2104_ID = "scheduled-huma2104-hot";
const MARK3220_ID = "scheduled-mark3220-hot";
const COMP3511_ID = "scheduled-comp3511-review";
const ECON2103_ID = "scheduled-econ2103-review";
const TEMG3950_ID = "scheduled-temg3950-review";

export const DEFAULT_SCHEDULED_QUIZ_IDS = [
  MATH2411_ID,
  HUMA2104_ID,
  MARK3220_ID,
  COMP3511_ID,
  ECON2103_ID,
  TEMG3950_ID,
] as const;

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
    "The Central Limit Theorem (CLT) is most closely about the sampling distribution of:",
    ["A single observation", "The sample mean (or sum) of many observations", "The population maximum", "The sample range"],
    1,
    "Under common conditions, averages of many draws have an approximately normal distribution even when the population is not normal.",
  ),
  q(
    `${MATH2411_ID}-2`,
    "Roughly speaking, as sample size n increases (with usual regularity conditions), the distribution of the sample mean tends to:",
    ["Always match the population shape exactly", "Become more normal-shaped", "Become uniform", "Collapse to a point"],
    1,
    "That stabilizing/normalizing behavior for averages is the core CLT idea.",
  ),
  q(
    `${MATH2411_ID}-3`,
    "A common CLT setup assumes observations are independent and identically distributed (i.i.d.) with finite:",
    ["Population size", "Variance (and typically a well-defined mean)", "Median only", "Mode only"],
    1,
    "Finite variance (and a mean) are standard assumptions in the classical CLT for means.",
  ),
  q(
    `${MATH2411_ID}-4`,
    "If you standardize the sample mean by subtracting μ and dividing by σ/√n (known σ), the resulting quantity is often used to argue it is approximately:",
    ["Chi-squared", "Standard normal", "Exponential", "Cauchy"],
    1,
    "That is the usual z-style standardization linked to normal approximations for means.",
  ),
  q(
    `${MATH2411_ID}-5`,
    "For a sample proportion p̂ from a large random sample, a normal approximation is justified in part because p̂ is:",
    ["Always exactly normal for any n", "A type of average / mean of Bernoulli outcomes", "Unrelated to means", "Only defined for continuous data"],
    1,
    "A proportion is a mean of 0/1 outcomes, so CLT intuition applies when n is large enough.",
  ),
  q(
    `${MATH2411_ID}-6`,
    "If the population is already exactly normal, the sampling distribution of the sample mean is:",
    ["Never normal", "Normal for any sample size n ≥ 1", "Only normal if n > 30", "Always uniform"],
    1,
    "Averages of normal data are normal; CLT is extra reassurance when the population is not normal.",
  ),
  q(
    `${MATH2411_ID}-7`,
    "The standard error of the mean typically scales with σ and n as:",
    ["σ·n", "σ/√n", "σ/n²", "σ + √n"],
    1,
    "Var(X̄) = σ²/n, so SD(X̄) = σ/√n under i.i.d. assumptions.",
  ),
  q(
    `${MATH2411_ID}-8`,
    "For a skewed population distribution, with a large enough n, the sampling distribution of X̄ is often:",
    ["Exactly skewed like the population forever", "Approximately symmetric/normal for practical purposes", "Always bimodal", "Undefined"],
    1,
    "CLT: averaging smooths skew; large n makes the mean’s distribution more bell-shaped.",
  ),
  q(
    `${MATH2411_ID}-9`,
    "The “n large enough” rule of thumb for CLT approximations is:",
    ["A fixed universal law with no exceptions", "Context-dependent; depends on skew and use case", "Only valid if n = 30 exactly", "Only for discrete data"],
    1,
    "Textbooks sometimes say n ≥ 30 as a heuristic, but heavy skew or rare events need larger n.",
  ),
  q(
    `${MATH2411_ID}-10`,
    "CLT is about the distribution of an average (or sum). It does not claim that:",
    ["Means become more normal with large n (under conditions)", "Every individual observation becomes normal", "Proportions can be approximated for large n", "Sums of many small effects can look normal"],
    1,
    "Individual data points keep the population distribution; it is the aggregate/average that tends toward normality.",
  ),
];

const huma2104Questions: UiQuizQuestion[] = [
  q(
    `${HUMA2104_ID}-1`,
    "In Western art music, counterpoint is primarily the combination of:",
    ["One melody and only percussion", "Multiple independent melodic lines (voices)", "Only chords with no melody", "Random noise textures"],
    1,
    "Counterpoint studies how separate melodies interlock rhythmically and harmonically.",
  ),
  q(
    `${HUMA2104_ID}-2`,
    "First species (species 1) counterpoint classically pairs the cantus firmus with:",
    ["One counterpoint note per cantus note", "Four counterpoint notes per cantus note", "Only rests", "Only chords"],
    0,
    "Species 1 is note-against-note counterpoint over a fixed cantus firmus.",
  ),
  q(
    `${HUMA2104_ID}-3`,
    "Contrary motion between two voices means they generally move:",
    ["In the same direction by the same interval", "In opposite directions", "Not at all", "Only in parallel octaves"],
    1,
    "Contrary motion is a standard way to preserve independence between lines.",
  ),
  q(
    `${HUMA2104_ID}-4`,
    "In traditional tonal counterpoint, consecutive parallel perfect fifths between two voices are typically:",
    ["Encouraged everywhere", "Avoided as a weak voice-leading choice", "Required at cadences only", "Only used in jazz"],
    1,
    "Parallel fifths reduce the sense of independent harmonic motion between parts.",
  ),
  q(
    `${HUMA2104_ID}-5`,
    "A cantus firmus in counterpoint study is best described as:",
    ["A random drum loop", "A fixed given melody used as the foundation", "Only a tempo marking", "The final chord only"],
    1,
    "Students write a second line against a supplied cantus firmus.",
  ),
  q(
    `${HUMA2104_ID}-6`,
    "A canon is a type of strict counterpoint where:",
    ["Voices never repeat", "One voice imitates another after a delay, often exactly", "Only one pitch is allowed", "Form is always rondo"],
    1,
    "Canons are rule-based imitative counterpoint (e.g., rounds).",
  ),
  q(
    `${HUMA2104_ID}-7`,
    "A fugue typically begins with the subject stated alone, then enters again in other voices in:",
    ["Unison only forever", "Imitative entries at different pitch levels", "Reverse order alphabetically", "Silence"],
    1,
    "Fugal exposition layers staggered entries of the subject—core counterpoint craft.",
  ),
  q(
    `${HUMA2104_ID}-8`,
    "Dissonance in species counterpoint is usually:",
    ["Never allowed", "Allowed only with proper preparation and resolution", "Always on the downbeat only", "Ignored"],
    1,
    "Consonance/dissonance rules govern how tensions arrive and resolve between voices.",
  ),
  q(
    `${HUMA2104_ID}-9`,
    "Invertible counterpoint means:",
    ["Deleting the bass", "Voices can swap vertical roles so intervals still obey rules", "Playing only major scales", "Using only one rhythm"],
    1,
    "Intervals are checked when the counterpoint is flipped relative to the cantus.",
  ),
  q(
    `${HUMA2104_ID}-10`,
    "Compared to homophonic texture, contrapuntal texture emphasizes:",
    ["One melody with accompaniment only", "Rhythmic and melodic independence between parts", "Only drones", "Unmeasured speech"],
    1,
    "Counterpoint highlights equality and interplay of melodic lines.",
  ),
];

const temg3950Questions: UiQuizQuestion[] = [
  q(
    `${TEMG3950_ID}-1`,
    "In the MECE framework, the “ME” stands for categories that are:",
    ["Mutually Exhaustive", "Mutually Exclusive", "Mostly Equal", "Marginally Effective"],
    1,
    "ME = Mutually Exclusive (no problematic overlap between buckets at the same level).",
  ),
  q(
    `${TEMG3950_ID}-2`,
    "In MECE, the “CE” stands for categories that are:",
    ["Collectively Exhaustive", "Creatively Empty", "Cost Effective only", "Customer Exclusive"],
    0,
    "CE = Collectively Exhaustive (together they cover the whole space you care about).",
  ),
  q(
    `${TEMG3950_ID}-3`,
    "If two buckets at the same level of a breakdown both include the same revenue stream, you violate:",
    ["Collective exhaustiveness", "Mutual exclusivity", "Neither", "Only formatting rules"],
    1,
    "Overlap breaks mutual exclusivity unless you redefine buckets clearly.",
  ),
  q(
    `${TEMG3950_ID}-4`,
    "If your framework omits an entire major customer segment, you violate:",
    ["Mutual exclusivity", "Collective exhaustiveness", "Only style guidelines", "Only the title slide"],
    1,
    "Missing a whole branch means the split is not collectively exhaustive.",
  ),
  q(
    `${TEMG3950_ID}-5`,
    "Issue trees used in consulting problem solving are often designed to be MECE at each level to:",
    ["Avoid doing any math", "Reduce overlap and gaps in logic", "Replace all data", "Eliminate stakeholders"],
    1,
    "MECE keeps the logic clean: no double counting, no blind spots.",
  ),
  q(
    `${TEMG3950_ID}-6`,
    "The Pyramid Principle (Barbara Minto) pairs well with MECE because it stresses:",
    ["Random bullet order", "Grouping supporting ideas under a single answer, without overlap/gaps", "Only storytelling", "Only fonts"],
    1,
    "Top-down logic with MECE groupings clarifies the argument.",
  ),
  q(
    `${TEMG3950_ID}-7`,
    "A MECE split of “profit” might separate revenue drivers and cost drivers because together they:",
    ["Are unrelated", "Cover profit levers while avoiding double counting at that level", "Always require 10 buckets", "Ignore fixed costs"],
    1,
    "At a high level, revenue vs cost is a classic exhaustive partition for profit.",
  ),
  q(
    `${TEMG3950_ID}-8`,
    "“MECE” is most associated with structured thinking in contexts such as:",
    ["Only poetry workshops", "Management consulting–style problem decomposition", "Only sports statistics", "Only tax filing for individuals"],
    1,
    "MECE is a standard consulting hygiene for frameworks and trees.",
  ),
  q(
    `${TEMG3950_ID}-9`,
    "If you label buckets “Region A” and “Key accounts,” and some key accounts sit in Region A, your framework is likely:",
    ["MECE by default", "Not MECE due to overlap between dimensions", "CE but not ME", "Always fine"],
    1,
    "Mixing overlapping dimensions in the same layer breaks mutual exclusivity.",
  ),
  q(
    `${TEMG3950_ID}-10`,
    "A good MECE checklist before presenting a framework is:",
    ["Overlap is fine if it looks pretty", "Can every item fit in exactly one bucket, and are all items covered?", "Use as many buckets as possible", "Skip the hypothesis"],
    1,
    "Sanity-check for exclusivity and exhaustiveness before locking the storyline.",
  ),
];

const mark3220Questions: UiQuizQuestion[] = [
  q(
    `${MARK3220_ID}-1`,
    "In the marketing research process, which step typically comes first?",
    ["Analyze data before defining the question", "Clarify the management decision and research problem", "Field the survey immediately", "Write the final report"],
    1,
    "You start by understanding what decision the research must support and what you need to learn.",
  ),
  q(
    `${MARK3220_ID}-2`,
    "Exploratory research is best described as:",
    ["Testing a specific hypothesis with a large probability sample", "Gaining initial insights when problems are vague", "Only measuring sales after a campaign", "Replacing all quantitative work"],
    1,
    "Exploratory work helps narrow questions and identify variables before conclusive designs.",
  ),
  q(
    `${MARK3220_ID}-3`,
    "Primary data are data that:",
    ["Were collected by someone else for another purpose", "You collect fresh for your current research objective", "Always come from government only", "Exclude surveys"],
    1,
    "Primary = firsthand collection (surveys, interviews, experiments) for your study.",
  ),
  q(
    `${MARK3220_ID}-4`,
    "Secondary data are:",
    ["Always qualitative", "Existing data originally gathered for another use", "Impossible to bias", "The same as internal analytics only"],
    1,
    "Secondary sources include syndicated reports, prior studies, and company records.",
  ),
  q(
    `${MARK3220_ID}-5`,
    "A probability sample is one in which:",
    ["Every element has a known, nonzero chance of selection", "You only interview friends", "You stop when bored", "You pick the most convenient mall"],
    0,
    "Probability sampling supports statistical inference to a defined population.",
  ),
  q(
    `${MARK3220_ID}-6`,
    "Reliability in measurement most closely means:",
    ["The measure hits the true concept every time", "Results are consistent when repeated under similar conditions", "The questionnaire is short", "Only experts may answer"],
    1,
    "Reliability is repeatability; validity is whether you measure the right construct.",
  ),
  q(
    `${MARK3220_ID}-7`,
    "Validity in measurement most closely means:",
    ["Respondents finished quickly", "The instrument actually captures the intended construct", "Sample size is always n = 30", "Cronbach’s alpha is always 1"],
    1,
    "Validity asks whether you are measuring what you claim to measure.",
  ),
  q(
    `${MARK3220_ID}-8`,
    "Likert-type agreement scales (e.g., 1–5) are usually treated as at least:",
    ["Ratio-level with a true zero", "Ordinal (ordered categories)", "Nominal only", "Binary only"],
    1,
    "Ordered categories; analysts sometimes use parametric shortcuts but the level is fundamentally ordinal.",
  ),
  q(
    `${MARK3220_ID}-9`,
    "Nonresponse error in surveys refers to bias arising when:",
    ["Some selected respondents do not participate and differ from those who do", "You use too many colors in charts", "The sample is too large", "You pretest the questionnaire"],
    0,
    "Patterns of who refuses or is unreachable can skew estimates.",
  ),
  q(
    `${MARK3220_ID}-10`,
    "In the research process, the step of choosing a design (e.g., survey, experiment, observation) should align with:",
    ["Only the cheapest option", "The information needed and causal claims you can support", "Avoiding ethics review", "Deleting outliers first"],
    1,
    "Design choice trades off cost, timing, and whether you need correlation vs stronger causal evidence.",
  ),
];

const comp3511Questions: UiQuizQuestion[] = [
  q(
    `${COMP3511_ID}-1`,
    "In OS I/O architecture, a device driver typically:",
    ["Replaces the CPU entirely", "Provides a kernel interface to a specific device or controller", "Runs only in user space with no privileges", "Stores files on the disk permanently"],
    1,
    "Drivers encapsulate hardware-specific commands and expose a uniform kernel interface.",
  ),
  q(
    `${COMP3511_ID}-2`,
    "Block devices are usually accessed in:",
    ["Arbitrary single-byte streams only", "Fixed-size blocks (e.g., disk sectors)", "Only via interrupts", "Only by the BIOS"],
    1,
    "Disks and similar media are block-addressable; keyboards are character-oriented.",
  ),
  q(
    `${COMP3511_ID}-3`,
    "Character devices are best exemplified by:",
    ["A magnetic disk partition", "A keyboard or serial stream", "A RAID array only", "Swap space"],
    1,
    "Character devices deliver/accept a stream of bytes rather than fixed blocks.",
  ),
  q(
    `${COMP3511_ID}-4`,
    "Programmed I/O (polling) means the CPU:",
    ["Never touches devices", "Repeatedly checks device status until ready", "Uses only DMA", "Offloads work to the GPU always"],
    1,
    "Polling wastes cycles but is simple; interrupts notify when the device is ready.",
  ),
  q(
    `${COMP3511_ID}-5`,
    "An interrupt-driven I/O path typically lets the device:",
    ["Signal the CPU when it needs service", "Run without any OS involvement", "Replace virtual memory", "Encrypt all RAM"],
    0,
    "Hardware raises an interrupt; the OS schedules an interrupt handler (top/bottom half patterns vary).",
  ),
  q(
    `${COMP3511_ID}-6`,
    "Direct Memory Access (DMA) is used to:",
    ["Let devices transfer data to/from memory with minimal CPU byte copying", "Replace all device drivers", "Guarantee real-time scheduling", "Disable interrupts permanently"],
    0,
    "DMA engines move blocks between device and RAM while the CPU does other work (subject to bus rules).",
  ),
  q(
    `${COMP3511_ID}-7`,
    "Double buffering in I/O often helps by:",
    ["Using two CPU cores only", "Overlapping transfer of one buffer with processing of another", "Doubling RAM size always", "Removing the need for drivers"],
    1,
    "Pipeline overlap hides latency between producer and consumer.",
  ),
  q(
    `${COMP3511_ID}-8`,
    "Spooling (e.g., print spooler) mainly addresses:",
    ["Faster CPU clocks", "Mismatch between slow devices and bursty producer processes", "Kernel deadlocks only", "File deletion"],
    1,
    "Jobs queue to disk while a daemon feeds the slow device steadily.",
  ),
  q(
    `${COMP3511_ID}-9`,
    "Memory-mapped I/O maps device registers into:",
    ["Only the disk cache", "The CPU’s address space so loads/stores control hardware", "User stack only", "GPU texture memory only"],
    1,
    "Special physical pages are mapped so driver code uses normal memory operations on control registers.",
  ),
  q(
    `${COMP3511_ID}-10`,
    "The logical I/O layer in a layered I/O stack generally exposes:",
    ["Raw sector bit patterns only", "A consistent API (open/read/write) to applications", "Only interrupt vectors", "Hardware IRQ pins"],
    1,
    "Upper layers see files and descriptors; lower layers deal with drivers and controllers.",
  ),
];

const econ2103Questions: UiQuizQuestion[] = [
  q(
    `${ECON2103_ID}-1`,
    "A pure monopoly is best described as:",
    ["Many firms selling identical products", "A single seller of a product with no close substitutes", "Two firms in Cournot competition", "Perfect competition with free entry"],
    1,
    "Monopoly = one seller; the product often has few good substitutes and entry is blocked.",
  ),
  q(
    `${ECON2103_ID}-2`,
    "For a monopolist, marginal revenue is typically ____ price at positive output because:",
    ["Above; buyers are irrational", "Below; lowering price applies to all units sold", "Equal to; demand is horizontal", "Unrelated to; only costs matter"],
    1,
    "To sell more, the firm usually cuts price on infra-marginal units too, so MR < P.",
  ),
  q(
    `${ECON2103_ID}-3`,
    "A profit-maximizing monopolist chooses output where:",
    ["Price equals average total cost", "Marginal revenue equals marginal cost", "Marginal cost is zero", "Demand is unit elastic always"],
    1,
    "Same FOC as competitive firms in output choice: MR = MC (if interior solution).",
  ),
  q(
    `${ECON2103_ID}-4`,
    "Relative to perfect competition, single-price monopoly often creates deadweight loss because:",
    ["It produces where P = MC", "It restricts output and raises price above marginal cost", "It always makes negative profit", "It has no market power"],
    1,
    "DWL arises from output below the competitive level where willingness to pay equals MC.",
  ),
  q(
    `${ECON2103_ID}-5`,
    "Barriers to entry help sustain monopoly power by:",
    ["Guaranteeing demand is perfectly elastic", "Making it hard for new firms to enter and compete", "Forcing the monopolist to price at MC", "Eliminating consumer surplus"],
    1,
    "Patents, control of a key input, economies of scale, and legal restrictions are classic barriers.",
  ),
  q(
    `${ECON2103_ID}-6`,
    "A natural monopoly often arises when:",
    ["Average costs fall over the relevant output range so one firm is cheapest", "There are no fixed costs", "Demand is perfectly elastic", "Many small firms have lower unit costs"],
    0,
    "Large fixed costs and declining average cost make a single network supplier efficient.",
  ),
  q(
    `${ECON2103_ID}-7`,
    "Perfect price discrimination (first degree) by a monopolist would imply:",
    ["The same price for every unit", "Charging each unit at each buyer’s reservation price", "Random pricing", "Pricing below MC"],
    1,
    "With full information, the monopolist can capture all surplus; DWL can fall to zero in the idealized model.",
  ),
  q(
    `${ECON2103_ID}-8`,
    "Third-degree price discrimination means:",
    ["Different prices for different identifiable groups with different elasticities", "Charging each consumer their exact max willingness to pay for each unit", "Always illegal everywhere", "Setting P = MC for all groups"],
    0,
    "Examples: student vs adult tickets when groups have different demand elasticities.",
  ),
  q(
    `${ECON2103_ID}-9`,
    "The Lerner index (P − MC)/P is related to markup and, under profit max, ties to:",
    ["Always zero", "The inverse of the elasticity of demand on the firm’s demand curve", "Only fixed costs", "Average fixed cost only"],
    1,
    "For a simple monopolist, markup relates to elasticity: more elastic demand → smaller markup.",
  ),
  q(
    `${ECON2103_ID}-10`,
    "Rent seeking in monopoly contexts can refer to:",
    ["Firms competing away all profits through innovation", "Resources spent to obtain or preserve monopoly privileges rather than produce", "Always efficient lobbying", "Perfect competition"],
    1,
    "Lobbying, litigation, and excess entry attempts to capture monopoly rents can be socially costly.",
  ),
];

const byId: Record<string, UiQuiz> = {
  [MATH2411_ID]: {
    id: MATH2411_ID,
    title: "MATH2411 · Central Limit Theorem — Hot quiz",
    topic: "Central Limit Theorem",
    difficulty: "MEDIUM",
    questions: math2411Questions,
  },
  [HUMA2104_ID]: {
    id: HUMA2104_ID,
    title: "HUMA2104 · Counterpoint — Hot quiz",
    topic: "Counterpoint",
    difficulty: "MEDIUM",
    questions: huma2104Questions,
  },
  [MARK3220_ID]: {
    id: MARK3220_ID,
    title: "MARK3220 · Marketing Research Processes — Hot quiz",
    topic: "Marketing Research Processes",
    difficulty: "MEDIUM",
    questions: mark3220Questions,
  },
  [COMP3511_ID]: {
    id: COMP3511_ID,
    title: "COMP3511 · I/O Systems — Review",
    topic: "I/O Systems",
    difficulty: "MEDIUM",
    questions: comp3511Questions,
  },
  [ECON2103_ID]: {
    id: ECON2103_ID,
    title: "ECON2103 · Monopoly — Review",
    topic: "Monopoly",
    difficulty: "MEDIUM",
    questions: econ2103Questions,
  },
  [TEMG3950_ID]: {
    id: TEMG3950_ID,
    title: "TEMG3950 · MECE Frameworks — Review",
    topic: "MECE Frameworks",
    difficulty: "MEDIUM",
    questions: temg3950Questions,
  },
};

export function getDefaultScheduledUiQuiz(id: string): UiQuiz | null {
  return byId[id] ?? null;
}
