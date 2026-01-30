export type TransactionType = "INCOME" | "EXPENSE";

export interface TransactionDTO {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description?: string | null;
}
