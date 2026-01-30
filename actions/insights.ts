"use server";

import { db } from "@/lib/prisma";
import { calculateMetrics } from "@/lib/finance/metrics";
import { buildInsightContext } from "@/lib/ai/buildInsightContext";
import { generateInsights } from "@/lib/ai/generateInsights";

export type Insight = {
  title: string;
  message: string;
  recommendation?: string;
  severity: "positive" | "warning" | "danger";
};

const NATIONAL_AVERAGE_SAVINGS_RATE = 0.2;

function getSavingsComparison(savingsRate: number) {
  if (savingsRate >= 0.3)
    return { percentile: 75, severity: "positive" as const };
  if (savingsRate >= 0.2)
    return { percentile: 60, severity: "positive" as const };
  if (savingsRate >= 0.1)
    return { percentile: 40, severity: "warning" as const };
  return { percentile: 20, severity: "danger" as const };
}

export async function getUserInsights(
  clerkUserId: string
): Promise<Insight[]> {
  const user = await db.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!user) return [];

  const rows = await db.transaction.findMany({
    where: { userId: user.id },
    select: {
      amount: true,
      type: true,
      category: true,
      date: true,
    },
  });

  if (!rows.length) return [];

  const transactions = rows.map((t) => ({
    amount: Number(t.amount),
    type: t.type,
    category: t.category ?? undefined,
    date: t.date,
  }));

  const metrics = calculateMetrics(transactions);
  const comparison = getSavingsComparison(metrics.savingsRate);

  /* ------------------------------------------------------------------ */
  /*  AI INSIGHTS                                                      */
  /* ------------------------------------------------------------------ */

  let aiInsights: unknown = null;

  try {
    aiInsights = await generateInsights(
      buildInsightContext(metrics)
    );

    console.log("AI insights raw:", aiInsights);
  } catch (err) {
    console.error("AI insight generation failed:", err);
  }

  const extractedInsights =
    typeof aiInsights === "object" &&
    aiInsights !== null &&
    "insights" in aiInsights &&
    Array.isArray((aiInsights as any).insights)
      ? (aiInsights as any).insights
      : null;

  if (
    extractedInsights &&
    extractedInsights.every(
      (i: any) =>
        typeof i.title === "string" &&
        typeof i.message === "string"
    )
  ) {
    return extractedInsights.map((i: any) => ({
      title: i.title,
      message: i.message,
      recommendation: i.recommendation,
      severity: comparison.severity,
    }));
  }

  /* ------------------------------------------------------------------ */
  /* FALLBACK INSIGHTS                                                */
  /* ------------------------------------------------------------------ */

  return [
    {
      title: "Income vs Expense Snapshot",
      severity: comparison.severity,
      message: `
You save ${(metrics.savingsRate * 100).toFixed(0)}% of your income,
which is better than approximately ${comparison.percentile}% of users nationwide.
      `.trim(),
      recommendation:
        metrics.savingsRate >= NATIONAL_AVERAGE_SAVINGS_RATE
          ? "Consider investing part of your surplus or building an emergency fund."
          : "Reducing lifestyle expenses could help you improve your savings rate.",
    },
    {
      title: "Expense Awareness",
      severity: metrics.spendingRate > 0.8 ? "danger" : "warning",
      message:
        "Your transaction history shows clear spending patterns across categories.",
      recommendation:
        "Review your largest expense category and set a soft monthly limit.",
    },
  ];
}
