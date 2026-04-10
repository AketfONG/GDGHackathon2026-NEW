export type DriftReason =
  | "low_accuracy_trend"
  | "timing_slowdown"
  | "guess_burst"
  | "idle_spike"
  | "schedule_misalignment"
  | "low_focus_reported";

export type InterventionKind =
  | "RECAP_2MIN"
  | "CONFIDENCE_RESET"
  | "SWITCH_DIFFICULTY"
  | "SCHEDULE_REPLAN"
  | "MENTOR_PING";

export type DriftScoreInput = {
  accuracyAvg: number;
  medianResponseMs: number;
  rapidGuessCount: number;
  idleSpikeCount: number;
  adherenceScore: number;
  latestFocusLevel: number | null;
};

export type DriftScoreOutput = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reasons: DriftReason[];
};
