"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

/* ------------------------------------------------------------------ */
/* DTO TYPES                                                           */
/* ------------------------------------------------------------------ */

export interface AccountDTO {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: string; // Decimal → string
  isDefault: boolean;
  userId: string;
  _count: {
    transactions: number;
  };
}

export interface DashboardTransactionDTO {
  id: string;
  date: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  accountId: string;
}

export interface BudgetOverviewDTO {
  budget: {
    id: string;
    amount: string;
    lastAlertSent: string | null;
  } | null;
  currentExpenses: string;
}

/* ------------------------------------------------------------------ */
/* SERIALIZERS                                                          */
/* ------------------------------------------------------------------ */

function serializeAccount(account: {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: Decimal;
  isDefault: boolean;
  userId: string;
  _count: { transactions: number };
}): AccountDTO {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance.toString(),
    isDefault: account.isDefault,
    userId: account.userId,
    _count: account._count,
  };
}

function serializeDashboardTransaction(t: {
  id: string;
  date: Date;
  amount: Decimal;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  accountId: string;
}): DashboardTransactionDTO {
  return {
    id: t.id,
    date: t.date.toISOString(),
    amount: t.amount.toString(),
    type: t.type,
    category: t.category,
    description: t.description,
    accountId: t.accountId,
  };
}

/* ------------------------------------------------------------------ */
/* GET USER ACCOUNTS                                                   */
/* ------------------------------------------------------------------ */


export async function getUserAccounts(): Promise<AccountDTO[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      transactions: {
        select: {
          amount: true,
          type: true,
        },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  return accounts.map((account) => {
    const derivedBalance = account.transactions.reduce(
      (sum, tx) => {
        const amount = Number(tx.amount);
        return tx.type === "INCOME"
          ? sum + amount
          : sum - amount;
      },
      0
    );

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: derivedBalance.toFixed(2),
      isDefault: account.isDefault,
      userId: account.userId,
      _count: account._count,
    };
  });
}
/* ------------------------------------------------------------------ */
/* CREATE ACCOUNT                                                      */
/* ------------------------------------------------------------------ */

export async function createAccount(data: {
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: string;
  isDefault: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const balanceDecimal = new Decimal(data.balance);

  const existingAccounts = await db.account.findMany({
    where: { userId: user.id },
  });

  const shouldBeDefault =
    existingAccounts.length === 0 ? true : data.isDefault;

  if (shouldBeDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await db.account.create({
    data: {
      name: data.name,
      type: data.type,
      balance: balanceDecimal,
      isDefault: shouldBeDefault,
      userId: user.id,
    },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  revalidatePath("/dashboard");

  return {
    success: true,
    data: serializeAccount(account),
  };
}

/* ------------------------------------------------------------------ */
/* DASHBOARD TRANSACTIONS                                              */
/* ------------------------------------------------------------------ */

export async function getDashboardData(): Promise<DashboardTransactionDTO[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      amount: true,
      type: true,
      category: true,
      description: true,
      accountId: true,
    },
  });

  return transactions.map(serializeDashboardTransaction);
}

/* ------------------------------------------------------------------ */
/* CURRENT BUDGET                                                      */
/* ------------------------------------------------------------------ */

export async function getCurrentBudget(
  accountId: string
): Promise<BudgetOverviewDTO | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const budget = await db.budget.findFirst({
    where: { userId: user.id },
  });

  if (!budget) return null;

  const expenses = await db.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId: user.id,
      accountId,
      type: "EXPENSE",
    },
  });

  return {
    budget: {
      id: budget.id,
      amount: budget.amount.toString(),
      lastAlertSent: budget.lastAlertSent?.toISOString() ?? null,
    },
    currentExpenses: expenses._sum.amount
      ? expenses._sum.amount.toString()
      : "0",
  };
}

