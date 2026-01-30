import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { calculateSpendingScore } from "@/lib/metrics/spending-score";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkUserId = searchParams.get("userId");
    const accountId = searchParams.get("accountId");

    if (!clerkUserId || !accountId || accountId === "undefined") {
      return NextResponse.json(
        { error: "Invalid userId or accountId" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------ */
    /* Resolve INTERNAL user.id from Clerk ID                        */
    /* ------------------------------------------------------------ */

    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = user.id;

    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    /* ------------------------------------------------------------ */
    /* Transactions (ACCOUNT + INTERNAL USER)                       */
    /* ------------------------------------------------------------ */

    const transactions = await db.transaction.findMany({
      where: {
        userId,
        accountId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        amount: true,
        date: true,
        type: true,
      },
    });

    const totalSpent = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const daysWithSpending = new Set(
      transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .map((t) => t.date.toDateString())
    ).size;

    /* ------------------------------------------------------------ */
    /* Budget (USER-LEVEL, INTERNAL ID)                              */
    /* ------------------------------------------------------------ */

    const budget = await db.budget.findUnique({
      where: { userId },
      select: { amount: true },
    });

    const totalBudget = budget
      ? budget.amount.toNumber()
      : 0;

    /* ------------------------------------------------------------ */
    /* DEBUG                                                          */
    /* ------------------------------------------------------------ */

    console.log("SPENDING SCORE INPUT", {
      totalIncome,
      totalSpent,
      totalBudget,
    });

    /* ------------------------------------------------------------ */
    /* Score                                                        */
    /* ------------------------------------------------------------ */

    const score = calculateSpendingScore({
      totalIncome,
      totalSpent,
      totalBudget,
      daysInMonth: end.getDate(),
      daysWithSpending,
    });

    return NextResponse.json({ score });
  } catch (error) {
    console.error("Spending score error:", error);
    return NextResponse.json(
      { error: "Failed to calculate spending score" },
      { status: 500 }
    );
  }
}
