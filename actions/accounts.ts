"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { accountSchema } from "@/app/lib/schema";
import { serializeTransaction } from "@/lib/serializers/transaction";
import { revalidatePath } from "next/cache";

// --------------------------------------------------------
// CREATE ACCOUNT
// --------------------------------------------------------
export async function createAccount(input: unknown) {
  try {
    const { name, type, balance, isDefault } = accountSchema.parse(input);

    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (isDefault) {
      await db.account.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        name,
        type,
        balance: new Decimal(balance),
        isDefault,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance.toFixed(2),
        isDefault: account.isDefault,
        userId: account.userId,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Account creation error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues?.[0]?.message ?? "Invalid input data",
      };
    }

    return { success: false, message: "Unexpected error" };
  }
}

// --------------------------------------------------------
// UPDATE DEFAULT ACCOUNT
// --------------------------------------------------------
export async function updateDefaultAccount(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const target = user.accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: "Account not found" };
    }

    await db.account.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });

    await db.account.update({
      where: { id: accountId },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update default account error:", error);
    return { success: false, message: "Internal server error" };
  }
}

// --------------------------------------------------------
// GET ACCOUNT WITH TRANSACTIONS
// --------------------------------------------------------
export async function getAccountWithTransactions(accountId?: string | null) {
  if (!accountId) return null;

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!account) return null;

  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance.toFixed(2),
    isDefault: account.isDefault,
    userId: account.userId,
    _count: {
      transactions: account._count.transactions,
    },
    transactions: account.transactions.map(serializeTransaction),
  };
}
