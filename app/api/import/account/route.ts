import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

import { extractPDFText } from "@/lib/import/pdf-extract";
import { parseCSV } from "@/lib/import/csv-parser";
import { categorizeTransactions } from "@/lib/import/categorize";
import { normalizeTransactions } from "@/lib/import/normalize";
import { normalizeOCRText } from "@/lib/ocr/normalize";
import { extractTransactions } from "@/lib/ai/extractTransactions";

/* ------------------------------------------------------------ */
/* Canonical import transaction shape                           */
/* ------------------------------------------------------------ */
type ImportTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const accountId = formData.get("accountId") as string | null;

    if (!file || !accountId) {
      return NextResponse.json(
        { error: "Missing file or accountId" },
        { status: 400 }
      );
    }

    const account = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let transactions: ImportTransaction[] = [];

    /* ------------------------------------------------------------ */
    /* CSV FLOW                                                     */
    /* ------------------------------------------------------------ */
    if (file.name.endsWith(".csv")) {
      const parsed = parseCSV(buffer.toString("utf-8"));

      transactions = parsed.map(
        (t): ImportTransaction => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
        })
      );
    }

    /* ------------------------------------------------------------ */
    /* PDF FLOW                                                     */
    /* ------------------------------------------------------------ */
    else if (file.name.endsWith(".pdf")) {
      const rawText = await extractPDFText(buffer);
      const cleanText = normalizeOCRText(rawText);

      const ai = await extractTransactions(cleanText);

      transactions = ai.transactions.map(
        (t): ImportTransaction => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type === "CREDIT" ? "INCOME" : "EXPENSE",
        })
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------ */
    /* Auto-categorization                                          */
    /* ------------------------------------------------------------ */
    const categorized = await categorizeTransactions(transactions);

    /* ------------------------------------------------------------ */
    /* Final normalization + save                                   */
    /* ------------------------------------------------------------ */
    const normalized = normalizeTransactions(
      categorized,
      account.userId,
      account.id
    );

    await db.transaction.createMany({
      data: normalized,
      skipDuplicates: true,
    });

    return NextResponse.json({
      imported: normalized.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import statement" },
      { status: 500 }
    );
  }
}
