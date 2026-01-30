"use client";

import { formatCurrency } from "@/lib/utils";

interface NetWorthSummaryProps {
  predictedNetWorth: number;
  years: number;
  netMonthlySavings: number;
}

export default function NetWorthSummary({
  predictedNetWorth,
  years,
  netMonthlySavings,
}: NetWorthSummaryProps) {
  return (
    <div className="text-center space-y-2 py-4">
      <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
        {formatCurrency(predictedNetWorth)}
      </div>

      <p className="text-sm text-muted-foreground">
        Estimated net worth in {years} years
      </p>

      <p className="text-xs text-muted-foreground">
        Saving {formatCurrency(netMonthlySavings)} every month
      </p>
    </div>
  );
}
