import { FinanceMetrics } from "./types";

export function calculateHealthScore(metrics: FinanceMetrics): number {
  const score =
    metrics.savingsRate * 40 +
    (1 - metrics.spendingRate) * 30 +
    30;

  return Math.min(100, Math.max(0, Math.round(score)));
}
