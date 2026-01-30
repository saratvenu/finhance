import { FinanceTransaction, FinanceMetrics } from "./types";

export function calculateMetrics(
  transactions: FinanceTransaction[]
): FinanceMetrics {
  const income = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = income - expenses;

  return {
    income,
    expenses,
    savings,
    savingsRate: income > 0 ? savings / income : 0,
    spendingRate: income > 0 ? expenses / income : 0,
  };
}
