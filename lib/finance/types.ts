export type FinanceTransaction = {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
  date: Date;
};

export type FinanceMetrics = {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  spendingRate: number;
};
