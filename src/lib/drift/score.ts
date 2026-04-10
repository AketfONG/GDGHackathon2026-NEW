import { DriftScoreInput, DriftScoreOutput } from "@/lib/drift/types";

export function scoreDrift(input: DriftScoreInput): DriftScoreOutput {
  const reasons: DriftScoreOutput["reasons"] = [];
  let score = 0;

  if (input.accuracyAvg < 0.55) {
    score += 30;
    reasons.push("low_accuracy_trend");
  }

  if (input.medianResponseMs > 28000) {
    score += 15;
    reasons.push("timing_slowdown");
  }

  if (input.rapidGuessCount >= 4) {
    score += 15;
    reasons.push("guess_burst");
  }

  if (input.idleSpikeCount >= 3) {
    score += 12;
    reasons.push("idle_spike");
  }

  if (input.adherenceScore < 0.7) {
    score += 20;
    reasons.push("schedule_misalignment");
  }

  if (input.latestFocusLevel !== null && input.latestFocusLevel <= 2) {
    score += 10;
    reasons.push("low_focus_reported");
  }

  const riskScore = Math.max(0, Math.min(100, score));
  const riskLevel: DriftScoreOutput["riskLevel"] =
    riskScore >= 60 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW";

  return { riskScore, riskLevel, reasons };
}
