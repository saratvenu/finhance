import { TransactionType } from "@prisma/client";

/**
 * Canonical transaction shape used after parsing + categorization
 */
export type NormalizedInputTransaction = {
  date: string | Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
};

/**
 * Converts normalized import transactions into prisma ready records
 */
export function normalizeTransactions(
  transactions: NormalizedInputTransaction[],
  userId: string,
  accountId: string
) {
  return transactions
    .filter(
      (t) =>
        t.date &&
        t.amount !== null &&
        t.amount !== undefined &&
        t.description
    )
    .map((t) => ({
      date: typeof t.date === "string" ? new Date(t.date) : t.date,
      description: t.description,
      amount: Number(t.amount),
      type:
        t.type === "INCOME"
          ? TransactionType.INCOME
          : TransactionType.EXPENSE,
      category: t.category ?? "Other",
      userId,
      accountId,
    }));
}
