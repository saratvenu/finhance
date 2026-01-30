import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";

// Actions
import { getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import {
  getMonthlyExpenseAverages,
  getUserTransactions,
} from "@/actions/transaction";
import { getUserInsights } from "@/actions/insights";

// Components
import { AccountCard } from "@/components/account-card";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { BudgetProgress } from "@/components/budget-progress";
import { DashboardOverview } from "@/components/dashboard-chart";

// Local components
import PredictNetWorthCard from "./_components/predict-networth-card";
import { InsightsCard } from "./_components/insights-card";
import SpendingScoreCard from "./_components/spending-score";

// HeroUI
import { Card, CardBody } from "@heroui/card";

// Types
import type { AccountDTO } from "@/actions/dashboard";
import type { TransactionDTO } from "@/types/transaction";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  /* ------------------------------------------------------------------ */
  /* Accounts                                                           */
  /* ------------------------------------------------------------------ */

  const accounts = await getUserAccounts();
  const defaultAccount =
    accounts.find((a) => a.isDefault) ?? null;

  /* ------------------------------------------------------------------ */
  /* Budget                                                             */
  /* ------------------------------------------------------------------ */

  const budgetData = defaultAccount
    ? await getCurrentBudget(defaultAccount.id)
    : null;

  const monthlyAverages = defaultAccount
    ? await getMonthlyExpenseAverages(defaultAccount.id)
    : [];

  /* ------------------------------------------------------------------ */
  /* Transactions                                                       */
  /* ------------------------------------------------------------------ */

  const txResult = await getUserTransactions();

  const transactions: TransactionDTO[] =
    txResult.success
      ? txResult.data.map((tx) => ({
          id: tx.id,
          accountId: tx.accountId,
          amount: Number(tx.amount),
          type: tx.type,
          category: tx.category,
          date: tx.date.toISOString(),
          description: tx.description,
        }))
      : [];

  /* ------------------------------------------------------------------ */
  /* Net Worth                                                          */
  /* ------------------------------------------------------------------ */

  const currentNetWorth = accounts.reduce<number>(
    (total, acc) => total + Number(acc.balance),
    0
  );

  const incomeTx = transactions.filter(
    (tx) => tx.type === "INCOME"
  );

  const expenseTx = transactions.filter(
    (tx) => tx.type === "EXPENSE"
  );

  const avgMonthlyIncome =
    incomeTx.reduce((sum, tx) => sum + tx.amount, 0) / 12 || 0;

  const avgMonthlyExpense =
    expenseTx.reduce((sum, tx) => sum + tx.amount, 0) / 12 || 0;

  /* ------------------------------------------------------------------ */
  /* Insights                                                           */
  /* ------------------------------------------------------------------ */

  const insights = await getUserInsights(user.id);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-10">
      {/* ACCOUNTS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card
            className="
              relative group
              h-full min-h-[150px]
              flex items-center justify-center
              cursor-pointer text-white
              bg-gradient-to-br from-blue-500 via-cyan-500 to-navy-500
            "
          >
            <CardBody className="flex flex-col items-center justify-center">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">
                Add New Account
              </p>
            </CardBody>
          </Card>
        </CreateAccountDrawer>

        {accounts.map((account: AccountDTO) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      {/* SPENDING SCORE */}
      {defaultAccount?.id && (
        <SpendingScoreCard
          userId={user.id}
          accountId={defaultAccount.id}
        />
      )}

      {/* DASHBOARD OVERVIEW */}
      {defaultAccount && (
        <DashboardOverview
          accounts={accounts}
          transactions={transactions}
          defaultAccountId={defaultAccount.id}
        />
      )}

      {/* BUDGET */}
      {budgetData && defaultAccount && (
        <BudgetProgress
          accountName={defaultAccount.name}
          initialBudget={budgetData.budget}
          currentExpenses={budgetData.currentExpenses}
          monthlyAverages={monthlyAverages}
        />
      )}

      {/* INSIGHTS */}
      <InsightsCard insights={insights} />

      {/* NET WORTH PREDICTOR */}
      <PredictNetWorthCard
        currentNetWorth={currentNetWorth}
        avgMonthlyIncome={avgMonthlyIncome}
        avgMonthlyExpense={avgMonthlyExpense}
      />
    </div>
  );
}
