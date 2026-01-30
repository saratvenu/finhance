"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

// HeroUI
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";

// DTO
import type { TransactionDTO } from "@/lib/serializers/transaction";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type DateRangeKey = "7D" | "1M" | "3M" | "6M" | "ALL";

interface ChartPoint {
  date: string;
  income: number;
  expense: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DATE_RANGES: Record<
  DateRangeKey,
  { label: string; days: number | null }
> = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface Props {
  transactions: TransactionDTO[];
}

export function AccountChart({ transactions }: Props) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("1M");

  /* ------------------------------------------------------------------ */
  /* Chart Data                                                         */
  /* ------------------------------------------------------------------ */

  const filteredData = useMemo<ChartPoint[]>(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();

    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const grouped: Record<string, ChartPoint> = {};

    transactions.forEach((t) => {
      const txDate = new Date(t.date);
      if (txDate < startDate || txDate > endOfDay(now)) return;

      const label = format(txDate, "MMM dd");

      if (!grouped[label]) {
        grouped[label] = { date: label, income: 0, expense: 0 };
      }

      const amount = Number(t.amount);

      if (t.type === "INCOME") {
        grouped[label].income += amount;
      } else {
        grouped[label].expense += amount;
      }
    });

    return Object.values(grouped);
  }, [transactions, dateRange]);

  /* ------------------------------------------------------------------ */
  /* Totals                                                             */
  /* ------------------------------------------------------------------ */

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  const net = totals.income - totals.expense;

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <Card className="relative z-10">
      <CardHeader className="relative z-20 flex items-center justify-between">
        <h3 className="text-base font-medium">Transaction Overview</h3>

        <Select
          selectedKeys={[dateRange]}
          className="w-[160px]"
          aria-label="Select date range"
          onSelectionChange={(keys) =>
            setDateRange(Array.from(keys)[0] as DateRangeKey)
          }
        >
          {Object.entries(DATE_RANGES).map(([key, { label }]) => (
            <SelectItem key={key}>{label}</SelectItem>
          ))}
        </Select>
      </CardHeader>

      <CardBody className="relative">
        {/* SUMMARY */}
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-success">
              ₹{totals.income.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-danger">
              ₹{totals.expense.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                net >= 0 ? "text-success" : "text-danger"
              }`}
            >
              ₹{net.toFixed(2)}
            </p>
          </div>
        </div>

        {/* CHART */}
        <div className="relative h-[300px]">
          <div className="absolute inset-0 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                {/* GRADIENT DEFINITIONS */}
                <defs>
                  {/* Income – Green */}
                  <linearGradient
                    id="grad-income"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#166534" />
                  </linearGradient>

                  {/* Expense – Red */}
                  <linearGradient
                    id="grad-expense"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `₹${value}`}
                />
                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value ?? 0).toFixed(2)}`,
                    "",
                  ]}
                />
                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="url(#grad-income)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="url(#grad-expense)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
