"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Decimal } from "@prisma/client/runtime/library";

/* ------------------------------------------------------------------ */
/* DTO TYPES                                                           */
/* ------------------------------------------------------------------ */

export interface AccountDTO {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: string;
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
      _count: {
        select: { transactions: true },
      },
    },
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance.toString(),
    isDefault: account.isDefault,
    userId: account.userId,
    _count: {
      transactions: account._count.transactions,
    },
  }));
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

  return transactions.map((tx) => ({
    id: tx.id,
    date: tx.date.toISOString(),
    amount: tx.amount.toString(),
    type: tx.type,
    category: tx.category,
    description: tx.description,
    accountId: tx.accountId,
  }));
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
