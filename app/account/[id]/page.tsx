// app/account/[id]/page.tsx
import type { ReactElement } from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BarLoader } from "react-spinners";
import Link from "next/link";

import { getAccountWithTransactions } from "@/actions/accounts";
import { TransactionTable } from "@/app/account/_components/transaction-table";
import { AccountChart } from "@/app/account/_components/account-chart";
import ExportTransactionsButton from "@/components/export-transactions";

// HeroUI
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Divider as Separator } from "@heroui/divider";
import { Button } from "@heroui/button";
import { WalletIcon } from "@heroicons/react/24/solid";

// DTO
import type { TransactionDTO } from "@/lib/serializers/transaction";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: string;
  isDefault: boolean;
  userId: string;
  _count: {
    transactions: number;
  };
};

type Props = {
  params: { id?: string } | Promise<{ id?: string }>;
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default async function AccountPage({
  params,
}: Props): Promise<ReactElement> {
  const resolved = await params;
  const id = resolved?.id;

  if (!id) notFound();

  const accountData = await getAccountWithTransactions(id);
  if (!accountData) notFound();

  const { transactions, ...account } = accountData;

  const prettyType =
    account.type?.length > 0
      ? account.type.charAt(0) + account.type.slice(1).toLowerCase()
      : "Account";

  const balanceNumber = Number(account.balance);

  return (
    <div className="relative space-y-10 px-5">
      {/* =============================================================== */}
      {/* Header + Actions                                               */}
      {/* =============================================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-between">
        {/* Account Summary */}
        <div className="flex-1">
          <Card className="w-full p-4">
            <CardHeader className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <WalletIcon className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold capitalize gradient-title">
                    {account.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {prettyType} Account
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold">
                  ₹
                  {Number.isFinite(balanceNumber)
                    ? balanceNumber.toFixed(2)
                    : account.balance}
                </div>
                <div className="mt-1 flex items-center justify-end gap-2 text-sm text-muted-foreground">
                  <Badge>{account._count.transactions}</Badge>
                  <span>Transactions</span>
                </div>
              </div>
            </CardHeader>

            <CardBody>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                Account ID:{" "}
                <span className="font-mono break-all">{account.id}</span>
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Actions */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4 h-full">
            <div className="flex flex-col gap-3">
              {/* Primary – Add Transaction */}
              <Link href="/transaction/create" className="w-full">
                <Button
                  className="
                    w-full text-white
                    bg-gradient-to-r from-[#00E5FF] to-[#0061FF]
                    hover:opacity-95
                  "
                >
                  Add Transaction
                </Button>
              </Link>

              {/* Secondary – Import Statement (GREEN GRADIENT) */}
              <Link href={`/account/${id}/import`} className="w-full">
                <Button
                  className="
                    w-full text-white
                    bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500
                    hover:opacity-95
                  "
                >
                  Import statement
                </Button>
              </Link>

              {/* Utility – Export CSV */}
              <ExportTransactionsButton
                transactions={transactions as TransactionDTO[]}
                filename={`${account.name.replace(/\s+/g, "_")}_transactions.csv`}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* =============================================================== */}
      {/* Chart Section                                                   */}
      {/* =============================================================== */}
      <Suspense
        fallback={<BarLoader className="mt-4" width="100%" color="#9333ea" />}
      >
        <div className="relative z-0 mt-8">
          <AccountChart transactions={transactions} />
        </div>
      </Suspense>

      {/* =============================================================== */}
      {/* Transactions Table                                             */}
      {/* =============================================================== */}
      <Suspense
        fallback={<BarLoader className="mt-4" width="100%" color="#9333ea" />}
      >
        <div className="relative z-10 mt-8">
          <TransactionTable transactions={transactions} />
        </div>
      </Suspense>
    </div>
  );
}
