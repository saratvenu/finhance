/* ------------------------------------------------------------------ */
/* Spending Score Calculation Logic                                   */
/* ------------------------------------------------------------------ */

export type SpendingScoreInput = {
  totalIncome: number;
  totalSpent: number;
  totalBudget: number;
  daysInMonth: number;
  daysWithSpending: number;
};

export function calculateSpendingScore({
  totalIncome,
  totalSpent,
  totalBudget,
  daysInMonth,
  daysWithSpending,
}: SpendingScoreInput): number {
  let score = 100;

  /* ---------------- Budget adherence (PRIMARY) ---------------- */
  if (totalBudget > 0 && totalSpent > totalBudget) {
    const overRatio = totalSpent / totalBudget - 1;

    // Penalty for crossing the budget
    score -= 20;

    // Scale penalty based on how much over budget
    score -= Math.min(30, overRatio * 60);

    score = Math.min(score, 80);
  }

  /* ---------------- Savings rate ---------------- */
  if (totalIncome > 0) {
    const savingsRate =
      (totalIncome - totalSpent) / totalIncome;

    if (savingsRate < 0.2) {
      const penalty = Math.min(
        30,
        (0.2 - savingsRate) * 50
      );
      score -= penalty;
    }
  }

  /* ---------------- Spending consistency ---------------- */
  if (daysInMonth > 0) {
    const consistencyRate =
      daysWithSpending / daysInMonth;

    if (consistencyRate > 0.8) {
      score -= Math.min(
        20,
        (consistencyRate - 0.8) * 100 * 0.2
      );
    }
  }

  return Math.max(0, Math.min(100, Math.floor(score)));
}
