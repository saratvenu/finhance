"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BudgetDTO {
  id: string;
  userId: string;
  amount: string;
  lastAlertSent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentBudgetResult {
  budget: BudgetDTO | null;
  currentExpenses: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function serializeBudget(budget: {
  id: string;
  userId: string;
  amount: Decimal;
  lastAlertSent: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BudgetDTO {
  return {
    id: budget.id,
    userId: budget.userId,
    amount: budget.amount.toString(),
    lastAlertSent: budget.lastAlertSent?.toISOString() ?? null,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* GET CURRENT BUDGET                                                   */
/* ------------------------------------------------------------------ */

export async function getCurrentBudget(
  accountId: string
): Promise<CurrentBudgetResult> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Fetch user's budget
  const budget = await db.budget.findFirst({
    where: { userId: user.id },
  });

  // Calculate current month's expense total
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = await db.transaction.aggregate({
    where: {
      userId: user.id,
      accountId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    budget: budget ? serializeBudget(budget) : null,
    currentExpenses: expenses._sum.amount
      ? expenses._sum.amount.toString()
      : "0",
  };
}

/* ------------------------------------------------------------------ */
/* UPDATE BUDGET                                                        */
/* ------------------------------------------------------------------ */

export async function updateBudget(
  amount: string
): Promise<
  | { success: true; data: BudgetDTO }
  | { success: false; error: string }
> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const decimalAmount = new Decimal(amount);

    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount: decimalAmount,
      },
      create: {
        userId: user.id,
        amount: decimalAmount,
      },
    });

    // Revalidate relevant dashboards
    revalidatePath("/dashboard");
    revalidatePath("/account");

    return {
      success: true,
      data: serializeBudget(budget),
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update budget",
    };
  }
}
