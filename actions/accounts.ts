"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { AccountSchema } from "@/app/schemas/account-schema";
import { serializeTransaction } from "@/lib/serializers/transaction";

// --------------------------------------------------------
// Utility
// --------------------------------------------------------
type AnyObject = { [key: string]: any };

function serializeDecimal(obj: AnyObject) {
  const newObj: AnyObject = {};
  for (const key in obj) {
    const value = obj[key];
    if (value instanceof Decimal) {
      newObj[key] = value.toNumber();
    } else if (Array.isArray(value)) {
      newObj[key] = value.map((v) => serializeDecimal(v));
    } else if (value !== null && typeof value === "object") {
      newObj[key] = serializeDecimal(value);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}

// --------------------------------------------------------
// CREATE ACCOUNT
// --------------------------------------------------------
export async function createAccount(input: unknown) {
  try {
    const validatedData = AccountSchema.parse(input);
    const { name, type, balance, isDefault } = validatedData;

    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized: No user session found." };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, message: "User not found in the database." };
    }

    const account = await db.account.create({
      data: {
        name,
        type,
        balance: new Decimal(parseFloat(balance)),
        isDefault,
        userId: user.id,
      },
    });

    return { success: true, account };
  } catch (error) {
    console.error("Account creation error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues?.[0]?.message ?? "Invalid input data",
      };
    }

    return { success: false, message: "An unexpected error occurred." };
  }
}

// --------------------------------------------------------
// UPDATE DEFAULT ACCOUNT
// --------------------------------------------------------
export async function updateDefaultAccount(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized: No user session found." };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    const targetAccount = user.accounts.find((acc) => acc.id === accountId);
    if (!targetAccount) {
      return { success: false, message: "Account not found." };
    }

    await db.account.updateMany({
      where: {
        userId: user.id,
        NOT: { id: accountId },
      },
      data: { isDefault: false },
    });

    await db.account.update({
      where: { id: accountId },
      data: { isDefault: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update default account:", error);
    return { success: false, message: "Internal server error." };
  }
}

// --------------------------------------------------------
// GET ACCOUNT WITH TRANSACTIONS
// --------------------------------------------------------
export async function getAccountWithTransactions(accountId?: string | null) {
  // 1) Validate input
  if (!accountId) return null;

  // 2) Auth
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 3) Resolve user
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // 4) Fetch account + transactions
  const account = await db.account.findFirst({
    where: { id: accountId, userId: user.id },
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

  // --------------------------------------------------------
  // DERIVE BALANCE FROM TRANSACTIONS
  // --------------------------------------------------------
  const derivedBalance = account.transactions.reduce((sum, tx) => {
    const amount = Number(tx.amount);
    return tx.type === "INCOME"
      ? sum + amount
      : sum - amount;
  }, 0);

  // EXPLICIT SERVER TO CLIENT DTO
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: derivedBalance.toFixed(2),
    isDefault: account.isDefault,
    userId: account.userId,
    _count: account._count,
    transactions: account.transactions.map(serializeTransaction),
  };
}
