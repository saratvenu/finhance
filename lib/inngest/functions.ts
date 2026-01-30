import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/lib/emails/template";
import { sendEmail } from "@/actions/send-email";
import OpenAI from "openai";

/* ------------------------------------------------------------------ */
/* OpenAI Client                                                       */
/* ------------------------------------------------------------------ */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type MonthlyStats = {
  totalIncome: number;
  totalExpenses: number;
  byCategory: Record<string, number>;
};

/* ------------------------------------------------------------------ */
/* 1. Process Recurring Transaction                                   */
/* ------------------------------------------------------------------ */

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    if (!event?.data?.transactionId || !event?.data?.userId) return;

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: { account: true },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      await db.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description ?? ""} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        const delta =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: delta } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval!
            ),
          },
        });
      });
    });
  }
);

/* ------------------------------------------------------------------ */
/* 2. Trigger Recurring Transactions (CRON)                           */
/* ------------------------------------------------------------------ */

export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const recurring = await step.run("fetch-recurring", async () =>
      db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          OR: [
            { lastProcessed: null },
            { nextRecurringDate: { lte: new Date() } },
          ],
        },
      })
    );

    if (recurring.length > 0) {
      await inngest.send(
        recurring.map((t) => ({
          name: "transaction.recurring.process",
          data: { transactionId: t.id, userId: t.userId },
        }))
      );
    }

    return { triggered: recurring.length };
  }
);

/* ------------------------------------------------------------------ */
/* 3. Monthly Reports (OpenAI)                                        */
/* ------------------------------------------------------------------ */

async function generateFinancialInsights(
  stats: MonthlyStats,
  month: string
): Promise<string[]> {
  const prompt = `
Give 3 short, actionable financial insights.
Return ONLY a JSON array of strings.

Month: ${month}
Income: ${stats.totalIncome}
Expenses: ${stats.totalExpenses}
Categories: ${Object.entries(stats.byCategory)
    .map(([c, a]) => `${c}: ${a}`)
    .join(", ")}
`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    return JSON.parse(res.choices[0].message.content ?? "[]");
  } catch {
    return [
      "Review your largest expense categories.",
      "Consider setting clearer budgets.",
      "Recurring expenses may hide savings opportunities.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () =>
      db.user.findMany()
    );

    for (const user of users) {
      if (!user.email) continue;

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const monthName = lastMonth.toLocaleString("default", {
        month: "long",
      });

      const stats = await getMonthlyStats(user.id, lastMonth);
      const insights = await generateFinancialInsights(stats, monthName);

      await sendEmail({
        to: user.email,
        subject: `Your ${monthName} Financial Report`,
        react: EmailTemplate({
          userName: user.name ?? "there",
          type: "monthly-report",
          data: {
            stats,
            month: monthName,
            insights,
          },
        }),
      });
    }
  }
);

/* ------------------------------------------------------------------ */
/* 4. Budget Alerts (90% / 100%)                                      */
/* ------------------------------------------------------------------ */

export const checkBudgetAlerts = inngest.createFunction(
  {
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
  },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () =>
      db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: { where: { isDefault: true } },
            },
          },
        },
      })
    );

    for (const budget of budgets) {
      const account = budget.user.accounts[0];
      if (!account) continue;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      const sum = await db.transaction.aggregate({
        where: {
          userId: budget.userId,
          accountId: account.id,
          type: "EXPENSE",
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      });

      const spent = sum._sum.amount?.toNumber() ?? 0;
      const limit = Number(budget.amount);
      if (limit <= 0) continue;

      const percentage = (spent / limit) * 100;
      if (percentage < 90) continue;

      if (budget.lastAlertSent) {
        const lastAlertDate = new Date(budget.lastAlertSent);
        if (isSameMonth(lastAlertDate, new Date())) {
          continue;
        }
      }

      const alertType = percentage >= 100 ? "EXCEEDED" : "WARNING";

      console.log("Budget alert debug:", {
        budgetId: budget.id,
        userId: budget.userId,
        email: budget.user.email,
        percentage: percentage.toFixed(1),
      });

      await sendEmail({
        to: budget.user.email,
        subject:
          alertType === "EXCEEDED"
            ? "🚨 Budget Exceeded"
            : "⚠️ Budget Warning",
        react: EmailTemplate({
          userName: budget.user.name ?? "there",
          type: "budget-alert",
          data: {
            alertType,
            percentageUsed: percentage.toFixed(1),
            budgetAmount: limit.toFixed(2),
            totalExpenses: spent.toFixed(2),
            accountName: account.name,
          },
        }),
      });

      await db.budget.update({
        where: { id: budget.id },
        data: { lastAlertSent: new Date() },
      });
    }
  }
);

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

function isSameMonth(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function isTransactionDue(t: {
  lastProcessed: Date | null;
  nextRecurringDate: Date | null;
}): boolean {
  if (!t.lastProcessed || !t.nextRecurringDate) return true;
  return t.nextRecurringDate <= new Date();
}

function calculateNextRecurringDate(
  date: Date,
  interval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
): Date {
  const next = new Date(date);
  if (interval === "DAILY") next.setDate(next.getDate() + 1);
  if (interval === "WEEKLY") next.setDate(next.getDate() + 7);
  if (interval === "MONTHLY") next.setMonth(next.getMonth() + 1);
  if (interval === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  return next;
}

async function getMonthlyStats(
  userId: string,
  month: Date
): Promise<MonthlyStats> {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const txs = await db.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
  });

  return txs.reduce(
    (stats, t) => {
      const amt = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amt;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] ?? 0) + amt;
      } else {
        stats.totalIncome += amt;
      }
      return stats;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
      byCategory: {} as Record<string, number>,
    }
  );
}
