"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { scanReceiptWithOCRSpace } from "@/lib/ocr/scan-receipt";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type TransactionType = "INCOME" | "EXPENSE";
type RecurringInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

interface CreateTransactionInput {
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description?: string;
  merchantName?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
}

interface UpdateTransactionInput extends CreateTransactionInput {}

interface ScanReceiptResult {
  amount: number;
  date: Date;
  description: string;
  category: string;
  merchantName: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */

const serializeAmount = <T extends { amount: Prisma.Decimal }>(obj: T) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

/* -------------------------------------------------------------------------- */
/*                              Create Transaction                             */
/* -------------------------------------------------------------------------- */

export async function createTransaction(data: CreateTransactionInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: {
      id: data.accountId,
      userId: user.id,
    },
  });
  if (!account) throw new Error("Account not found");

  const transaction = await db.$transaction(async (tx) => {
    // Create transaction
    const created = await tx.transaction.create({
      data: {
        ...data,
        userId: user.id,
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(
                data.date,
                data.recurringInterval
              )
            : null,
      },
    });

    // Atomically update account balance
    await tx.account.update({
      where: { id: account.id },
      data: {
        balance:
          data.type === "INCOME"
            ? { increment: data.amount }
            : { decrement: data.amount },
      },
    });

    return created;
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${transaction.accountId}`);

  return { success: true, data: serializeAmount(transaction) };
}

/* -------------------------------------------------------------------------- */
/*                               Get Transaction                               */
/* -------------------------------------------------------------------------- */

export async function getTransaction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

/* -------------------------------------------------------------------------- */
/*                              Update Transaction                              */
/* -------------------------------------------------------------------------- */

export async function updateTransaction(
  id: string,
  data: UpdateTransactionInput
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const original = await db.transaction.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!original) throw new Error("Transaction not found");

  const oldChange =
    original.type === "EXPENSE"
      ? -original.amount.toNumber()
      : original.amount.toNumber();

  const newChange =
    data.type === "EXPENSE" ? -data.amount : data.amount;

  const netChange = newChange - oldChange;

  await db.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id },
      data: {
        ...data,
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(
                data.date,
                data.recurringInterval
              )
            : null,
      },
    });

    await tx.account.update({
      where: { id: original.accountId },
      data: {
        balance: { increment: netChange },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${original.accountId}`);

  const updated = await db.transaction.findFirst({
    where: { id, userId: user.id },
  });

  return { success: true, data: updated && serializeAmount(updated) };
}

/* -------------------------------------------------------------------------- */
/*                           Get User Transactions                              */
/* -------------------------------------------------------------------------- */

export async function getUserTransactions(
  query: Prisma.TransactionWhereInput = {}
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      ...query,
    },
    orderBy: { date: "desc" },
  });

  return { success: true, data: transactions };
}

/* -------------------------------------------------------------------------- */
/*                                Scan Receipt                                 */
/* -------------------------------------------------------------------------- */

export async function scanReceipt(file: File) {
  try {
    const result = await scanReceiptWithOCRSpace(file);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    return {
      success: false,
      error: "Failed to scan receipt. Please try again.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                          Recurring Date Helper                               */
/* -------------------------------------------------------------------------- */

function calculateNextRecurringDate(
  startDate: Date,
  interval: RecurringInterval
): Date {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

/* -------------------------------------------------------------------------- */
/*                     Monthly Expense Aggregation                              */
/* -------------------------------------------------------------------------- */

export async function getMonthlyExpenseAverages(
  accountId: string,
  months = 6
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      accountId,
      type: "EXPENSE",
      date: { gte: startDate },
    },
    select: {
      amount: true,
      date: true,
    },
  });

  const monthlyTotals = new Map<string, number>();

  for (const tx of transactions) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
    monthlyTotals.set(
      key,
      (monthlyTotals.get(key) ?? 0) + tx.amount.toNumber()
    );
  }

  return Array.from(monthlyTotals.values());
}

/* -------------------------------------------------------------------------- */
/*                              Delete Transaction                              */
/* -------------------------------------------------------------------------- */

export async function deleteTransaction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  await db.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: transaction.accountId },
      data: {
        balance:
          transaction.type === "INCOME"
            ? { decrement: transaction.amount }
            : { increment: transaction.amount },
      },
    });

    await tx.transaction.delete({
      where: { id },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath(`/account/${transaction.accountId}`);

  return { success: true };
}
