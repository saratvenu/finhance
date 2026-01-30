"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";

import { cn } from "@/lib/utils";
import type { TransactionDTO } from "@/types/transaction";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface Account {
  id: string;
  name: string;
}

type TimeRange = "7D" | "1M" | "3M" | "ALL";

interface Props {
  accounts: Account[];
  transactions: TransactionDTO[];
  defaultAccountId: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "7D", label: "Last 7 days" },
  { key: "1M", label: "Last 1 month" },
  { key: "3M", label: "Last 3 months" },
  { key: "ALL", label: "All time" },
];

const GRADIENTS = Array.from(
  { length: 12 },
  (_, i) => `url(#grad-${i + 1})`
);

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function DashboardOverview({
  accounts,
  transactions,
  defaultAccountId,
}: Props) {
  const [viewAccountId, setViewAccountId] =
    useState(defaultAccountId);

  const [timeRange, setTimeRange] =
    useState<TimeRange>("1M");

  /* ------------------------------------------------------------------ */
  /* Filter by account + time                                           */
  /* ------------------------------------------------------------------ */

  const filteredTransactions = useMemo(() => {
    const now = new Date();

    const startDate =
      timeRange === "ALL"
        ? null
        : new Date(
            timeRange === "7D"
              ? now.setDate(now.getDate() - 7)
              : timeRange === "1M"
              ? now.setMonth(now.getMonth() - 1)
              : now.setMonth(now.getMonth() - 3)
          );

    return transactions.filter((tx) => {
      if (tx.accountId !== viewAccountId) return false;
      if (!startDate) return true;
      return new Date(tx.date) >= startDate;
    });
  }, [transactions, viewAccountId, timeRange]);

  /* ------------------------------------------------------------------ */
  /* Recent transactions                                               */
  /* ------------------------------------------------------------------ */

  const recentTransactions = useMemo(
    () =>
      [...filteredTransactions]
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        )
        .slice(0, 5),
    [filteredTransactions]
  );

  /* ------------------------------------------------------------------ */
  /* Pie chart data                                                     */
  /* ------------------------------------------------------------------ */

  const pieChartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    for (const tx of filteredTransactions) {
      if (tx.type !== "EXPENSE") continue;
      grouped[tx.category] =
        (grouped[tx.category] ?? 0) + tx.amount;
    }

    return Object.entries(grouped).map(
      ([name, value]) => ({ name, value })
    );
  }, [filteredTransactions]);

  /* ------------------------------------------------------------------ */
  /* Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-base font-normal">
            Recent Transactions
          </h3>

          <Select
            selectedKeys={[viewAccountId]}
            className="w-[180px]"
            onSelectionChange={(keys) =>
              setViewAccountId(
                Array.from(keys)[0] as string
              )
            }
          >
            {accounts.map((account) => (
              <SelectItem
                key={account.id}
                textValue={account.name}
              >
                {account.name}
              </SelectItem>
            ))}
          </Select>
        </CardHeader>

        <CardBody className="space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No recent transactions
            </p>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {tx.description ?? "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(tx.date),
                      "PP"
                    )}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex items-center text-sm font-medium",
                    tx.type === "EXPENSE"
                      ? "text-red-400"
                      : "text-green-400"
                  )}
                >
                  {tx.type === "EXPENSE" ? (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  )}
                  ₹{tx.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-base font-normal">
            Expense Breakdown
          </h3>

          <Select
            selectedKeys={[timeRange]}
            className="w-[160px]"
            onSelectionChange={(keys) =>
              setTimeRange(
                Array.from(keys)[0] as TimeRange
              )
            }
          >
            {TIME_RANGES.map((range) => (
              <SelectItem
                key={range.key}
                textValue={range.label}
              >
                {range.label}
              </SelectItem>
            ))}
          </Select>
        </CardHeader>

        <CardBody>
          {pieChartData.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No expenses for this period
            </p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* ===== Gradients ===== */}
                  <defs>
                    {[
                      ["#4338CA", "#38BDF8"],
                      ["#065F46", "#34D399"],
                      ["#9A3412", "#FDBA74"],
                      ["#6D28D9", "#C4B5FD"],
                      ["#0F766E", "#5EEAD4"],
                      ["#92400E", "#FDE68A"],
                      ["#9D174D", "#F9A8D4"],
                      ["#1E40AF", "#93C5FD"],
                      ["#7C2D12", "#FED7AA"],
                      ["#166534", "#86EFAC"],
                      ["#312E81", "#A5B4FC"],
                      ["#164E63", "#67E8F9"],
                    ].map(([from, to], i) => (
                      <linearGradient
                        key={i}
                        id={`grad-${i + 1}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={from}
                        />
                        <stop
                          offset="100%"
                          stopColor={to}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    minAngle={3}
                    paddingAngle={1}
                  >
                    {pieChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          GRADIENTS[
                            i % GRADIENTS.length
                          ]
                        }
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toFixed(2)}`
                    }
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
