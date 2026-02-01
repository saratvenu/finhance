import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

import {
  categorizeTransactions,
  type CategorizeInput,
} from "@/lib/import/categorize";

/* ------------------------------------------------------------ */
/* Types                                                        */
/* ------------------------------------------------------------ */

type IncomingTransaction = {
  date: string | Date;
  description: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
};

/* ------------------------------------------------------------ */
/* POST                                                         */
/* ------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const accountId = body.accountId as string | undefined;
    const transactions = body.transactions as
      | IncomingTransaction[]
      | undefined;

    if (!accountId || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    /* ------------------------------------------------------------ */
    /* Deduplication                                                */
    /* ------------------------------------------------------------ */

    const existing = await db.transaction.findMany({
      where: { accountId },
      select: {
        date: true,
        amount: true,
        description: true,
      },
    });

    const existingSet = new Set(
      existing.map(
        (t) =>
          `${t.date.toISOString()}-${t.amount}-${
            t.description?.toLowerCase() ?? ""
          }`
      )
    );

    const uniqueTransactions = transactions.filter((t) => {
      if (!t.description) return false;

      const dateIso =
        typeof t.date === "string"
          ? new Date(t.date).toISOString()
          : t.date.toISOString();

      const key = `${dateIso}-${t.amount}-${t.description.toLowerCase()}`;

      return !existingSet.has(key);
    });

    if (uniqueTransactions.length === 0) {
      return NextResponse.json({ imported: 0 });
    }

    /* ------------------------------------------------------------ */
    /* Auto-categorization                                          */
    /* ------------------------------------------------------------ */

    const categorizationInput: CategorizeInput[] =
      uniqueTransactions.map((t) => ({
        date:
          typeof t.date === "string"
            ? t.date
            : t.date.toISOString().slice(0, 10),
        description: t.description ?? "",
        amount: t.amount,
        type: t.type,
        category: t.category,
      }));

    const categorized = await categorizeTransactions(
      categorizationInput
    );

    /* ------------------------------------------------------------ */
    /* Compute net balance change                                   */
    /* ------------------------------------------------------------ */

    let netBalanceChange = 0;

    for (const t of categorized) {
      netBalanceChange +=
        t.type === "INCOME" ? t.amount : -t.amount;
    }

    /* ------------------------------------------------------------ */
    /* Persist (ATOMIC)                                             */
    /* ------------------------------------------------------------ */

    await db.$transaction(async (tx) => {
      await tx.transaction.createMany({
        data: categorized.map((t) => ({
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          type:
            t.type === "INCOME"
              ? TransactionType.INCOME
              : TransactionType.EXPENSE,
          category: t.category ?? "Other",
          userId: account.userId,
          accountId,
        })),
      });

      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: { increment: netBalanceChange },
        },
      });
    });

    return NextResponse.json({
      imported: categorized.length,
    });
  } catch (error) {
    console.error("Confirm import error:", error);
    return NextResponse.json(
      { error: "Failed to confirm import" },
      { status: 500 }
    );
  }
}
