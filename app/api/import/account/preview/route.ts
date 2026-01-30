export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

import { extractPDFText } from "@/lib/import/pdf-extract";
import { parseCSV } from "@/lib/import/csv-parser";
import { categorizeTransactions } from "@/lib/import/categorize";
import { normalizeTransactions } from "@/lib/import/normalize";
import { normalizeOCRText } from "@/lib/ocr/normalize";
import { extractTransactions } from "@/lib/ai/extractTransactions";

/* ------------------------------------------------------------ */
/* Canonical preview transaction shape                          */
/* ------------------------------------------------------------ */
type PreviewTransaction = {
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
        { error: "Invalid request" },
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

    let transactions: PreviewTransaction[] = [];

    /* ------------------------------------------------------------ */
    /* CSV FLOW                                                     */
    /* ------------------------------------------------------------ */
    if (file.name.endsWith(".csv")) {
      try {
        const parsed = parseCSV(buffer.toString("utf-8"));

        transactions = parsed.map(
          (t): PreviewTransaction => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
          })
        );
      } catch (error) {
        console.error("CSV parsing error:", error);
        return NextResponse.json(
          {
            error: "Failed to parse CSV file",
            message: error instanceof Error ? error.message : "Invalid CSV format"
          },
          { status: 400 }
        );
      }
    }

    /* ------------------------------------------------------------ */
    /* PDF FLOW                                                     */
    /* ------------------------------------------------------------ */
    else if (file.name.endsWith(".pdf")) {
      try {
        const rawText = await extractPDFText(buffer);
        const cleanText = normalizeOCRText(rawText);

        const ai = await extractTransactions(cleanText);

        transactions = ai.transactions.map(
          (t): PreviewTransaction => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type === "CREDIT" ? "INCOME" : "EXPENSE",
          })
        );
      } catch (error) {
        console.error("PDF extraction error:", error);
        
        // Provide specific error messages based on the error type
        let errorMessage = "Unable to read PDF file";
        
        if (error instanceof Error) {
          if (error.message.includes("Invalid PDF")) {
            errorMessage = "The uploaded file is not a valid PDF";
          } else if (error.message.includes("password")) {
            errorMessage = "This PDF is password-protected and cannot be processed";
          } else if (error.message.includes("No text content")) {
            errorMessage = "No text could be extracted from this PDF. It may be an image-only PDF";
          } else {
            errorMessage = error.message;
          }
        }
        
        return NextResponse.json(
          {
            error: "Failed to process PDF",
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.stack
              : undefined
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a CSV or PDF file." },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------ */
    /* Validation: Check if we got any transactions                */
    /* ------------------------------------------------------------ */
    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        {
          error: "No transactions found",
          message: "The file was processed but no transaction data could be extracted"
        },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------ */
    /* Auto-categorization                                          */
    /* ------------------------------------------------------------ */
    const categorized = await categorizeTransactions(transactions);

    /* ------------------------------------------------------------ */
    /* Preview normalization (NOT saved)                            */
    /* ------------------------------------------------------------ */
    const preview = normalizeTransactions(
      categorized,
      account.userId,
      account.id
    );

    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Preview import error:", error);
    
    // Generic fallback error
    return NextResponse.json(
      {
        error: "Failed to preview import",
        message: error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing your file",
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined
      },
      { status: 500 }
    );
  }
}