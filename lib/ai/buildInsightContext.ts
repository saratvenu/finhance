import { FinanceMetrics } from "@/lib/finance/types";

export function buildInsightContext(metrics: FinanceMetrics) {
  return {
    userMetrics: {
      income: metrics.income,
      expenses: metrics.expenses,
      savings: metrics.savings,
      savingsRate: metrics.savingsRate,
      spendingRate: metrics.spendingRate,
    },
    nationalAverage: {
      savingsRate: 0.2,
      spendingRate: 0.7,
    },
    rules: [
      "You are a personal finance insights generator.",
      "Always return at least 2 insights.",
      "Each insight must include a title and a message.",
      "Recommendations are optional but encouraged.",
      "Base insights strictly on the provided metrics.",
      "Compare the user's behavior to national averages when relevant.",
      "Do NOT invent numbers.",
      "Do NOT return an empty array.",
      "Return ONLY valid JSON.",
    ],
  };
}
