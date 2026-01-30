import type { Transaction } from "@prisma/client";

/**
 * Server to client DTO for transactions
 * Decimal & date preserved as strings
 */
export function serializeTransaction(t: Transaction) {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount.toString(),
    description: t.description,
    date: t.date.toISOString(),
    category: t.category,
    receiptUrl: t.receiptUrl,
    isRecurring: t.isRecurring,
    recurringInterval: t.recurringInterval,
    nextRecurringDate: t.nextRecurringDate?.toISOString() ?? null,
    lastProcessed: t.lastProcessed?.toISOString() ?? null,
    status: t.status,
    userId: t.userId,
    accountId: t.accountId,
  };
}

export type TransactionDTO = ReturnType<typeof serializeTransaction>;
