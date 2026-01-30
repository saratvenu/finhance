import { parse } from "csv-parse/sync";

/**
 * Canonical CSV transaction shape
 * (matches categorize + normalize pipeline)
 */
export type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
};

export function parseCSV(csvText: string): ParsedTransaction[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records
    .map((row: any): ParsedTransaction | null => {
      const rawAmount = Number(row.amount ?? row.Amount);

      if (!row.date && !row.Date) return null;
      if (!row.description && !row.Description) return null;
      if (Number.isNaN(rawAmount)) return null;

      const dateValue = row.date ?? row.Date;

      return {
        date:
          typeof dateValue === "string"
            ? dateValue
            : new Date(dateValue).toISOString().slice(0, 10),

        description: String(
          row.description ?? row.Description
        ).trim(),

        amount: Math.abs(rawAmount),

        type: rawAmount < 0 ? "EXPENSE" : "INCOME",
      };
    })
    .filter(Boolean) as ParsedTransaction[];
}
