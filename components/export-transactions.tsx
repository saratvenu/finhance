"use client";

import React from "react";
import { ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";

export type TransactionClient = {
  id: string;
  amount: number | string;
  date: string;
  category?: string | null;
  description?: string | null;
};

function toCSV(rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map((r) =>
    keys
      .map((k) => {
        const v = r[k] ?? "";
        const s = String(v).replace(/"/g, '""');
        // surround fields containing comma/newline/quote with quotes
        return /[,"\n]/.test(s) ? `"${s}"` : s;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export default function ExportTransactionsButton({
  transactions,
  filename = "transactions.csv",
}: {
  transactions: TransactionClient[];
  filename?: string;
}) {
  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      return;
    }

    // map to simple flat objects
    const rows = transactions.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description ?? "",
      category: t.category ?? "",
      amount:
        typeof t.amount === "number"
          ? t.amount.toFixed(2)
          : t.amount ?? "",
    }));

    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-slate-800"
      title="Download transactions as CSV"
    >
      <ArrowDownOnSquareIcon className="h-4 w-4" />
      Export CSV
    </button>
  );
}
