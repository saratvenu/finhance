"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { AccountSchema } from "@/app/schemas/account-schema";

export async function createAccount(input: unknown) {
  try {
    // Validate input
    const validatedData = AccountSchema.parse(input);
    const { name, type, balance, isDefault } = validatedData;

    // Get Clerk userId
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "Unauthorized: No user session found." };
    }

    // Fetch internal user
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return { success: false, message: "User not found in the database." };
    }

    // Create the account
    const account = await db.account.create({
      data: {
        name,
        type,
        balance: new Decimal(parseFloat(balance)),
        isDefault,
        userId: user.id,
      },
    });

    // Serialize Prisma Decimal safely for client
    const serializedAccount = JSON.parse(
      JSON.stringify({
        ...account,
        balance: Number(account.balance),
      })
    );

    return { success: true, account: serializedAccount };
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
