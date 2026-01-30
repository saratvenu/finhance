"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";
import { Decimal as PrismaDecimal } from "@prisma/client/runtime/library";

/* ---------------------------
Category templates
--------------------------- */
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [10000, 100000] },
    { name: "freelance", range: [1000, 10000] },
    { name: "investments", range: [500, 25000] },
    { name: "other-income", range: [100, 10000] },
  ],
  EXPENSE: [
    { name: "housing", range: [10000, 100000] },
    { name: "transportation", range: [100, 1000] },
    { name: "groceries", range: [200, 2000] },
    { name: "utilities", range: [200, 3000] },
    { name: "entertainment", range: [50, 800] },
    { name: "food", range: [50, 1000] },
    { name: "shopping", range: [100, 10000] },
    { name: "healthcare", range: [100, 100000] },
    { name: "education", range: [200, 80000] },
    { name: "travel", range: [300, 20000] },
  ],
} as const;

/* ---------------------------
Types
--------------------------- */
type CategoryType = keyof typeof CATEGORIES;

type GeneratedTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  date: Date;
  category: string;
  status: "COMPLETED";
  userId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
};

/* ---------------------------
Helpers
--------------------------- */
function getRandomAmount(min: number, max: number): number {
  const v = Math.random() * (max - min) + min;
  return Math.round(v * 100) / 100;
}

function getRandomCategory(type: CategoryType) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

/* ---------------------------
Main export
--------------------------- */
export async function seedTransactions(
  accountId: string,
  userId: string,
  days = 5
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!accountId || !userId) {
      throw new Error("accountId and userId are required");
    }

    const transactions: GeneratedTransaction[] = [];
    let totalBalance = 0;

    // Generate `days` days of transactions (including today)
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        const type: "INCOME" | "EXPENSE" =
          Math.random() < 0.4 ? "INCOME" : "EXPENSE";

        const { category, amount } = getRandomCategory(type);
        const amountRounded = Math.round(amount * 100) / 100;

        const tx: GeneratedTransaction = {
          id:
            typeof crypto !== "undefined" &&
            typeof (crypto as any).randomUUID === "function"
              ? (crypto as any).randomUUID()
              : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
          type,
          amount: amountRounded.toFixed(2),
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId,
          accountId,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === "INCOME" ? amountRounded : -amountRounded;
        transactions.push(tx);
      }
    }

    // Insert into DB inside a transaction
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { accountId, userId },
      });

      const batchSize = 1000;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const chunk = transactions.slice(i, i + batchSize);
        await tx.transaction.createMany({ data: chunk });
      }

      await tx.account.update({
        where: { id: accountId, userId },
        data: {
          balance: new PrismaDecimal(totalBalance.toFixed(2)),
        },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions (days=${days})`,
    };
  } catch (error: any) {
    console.error("Error seeding transactions:", error);
    return {
      success: false,
      error: error?.message ?? String(error),
    };
  }
}
