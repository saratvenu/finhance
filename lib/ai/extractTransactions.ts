import { aiClient } from "@/lib/ai/client";

/* ------------------------------------------------------------ */
/* Types                                                         */
/* ------------------------------------------------------------ */
export type ExtractedTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
};

/* ------------------------------------------------------------ */
/* OpenAI-based transaction extraction                           */
/* ------------------------------------------------------------ */
export async function extractTransactions(
  statementText: string
): Promise<{ transactions: ExtractedTransaction[] }> {
  const prompt = `
Extract all bank transactions from the following statement text.

Return ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "CREDIT" | "DEBIT"
    }
  ]
}

Rules:
- Amount must always be positive
- Ignore balances, totals, opening/closing balance
- Ignore headers and footers
- Debit = money going out
- Credit = money coming in
- Use YYYY-MM-DD date format
- If currency symbols exist, remove them
- Sort transactions by date ascending

Statement:
"""${statementText}"""
`;

  try {
    const response = await aiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a bank statement parsing engine. You extract structured transaction data with high accuracy.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0].message.content;

    if (!raw) {
      throw new Error("Empty OpenAI response");
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("[extractTransactions] OpenAI error:", error);
    throw new Error("Failed to extract transactions from statement");
  }
}
