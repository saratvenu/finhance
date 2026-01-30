import { aiClient } from "@/lib/ai/client";

/* ------------------------------------------------------------ */
/* Canonical categorization input                               */
/* ------------------------------------------------------------ */
export type CategorizeInput = {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string; // MUST be a category ID
};

/* ------------------------------------------------------------ */
/* Allowed category IDs                                         */
/* ------------------------------------------------------------ */
const EXPENSE_CATEGORIES = [
  "housing",
  "transportation",
  "groceries",
  "utilities",
  "entertainment",
  "food",
  "shopping",
  "healthcare",
  "education",
  "personal",
  "travel",
  "insurance",
  "gifts",
  "bills",
  "other-expense",
] as const;

const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "investments",
  "business",
  "rental",
  "other-income",
] as const;

/* ------------------------------------------------------------ */
/* Deterministic merchant rules (category IDs)                  */
/* ------------------------------------------------------------ */
const MERCHANT_RULES: {
  pattern: RegExp;
  category: string;
}[] = [
  // Shopping
  { pattern: /amazon|flipkart/i, category: "shopping" },

  // Food
  { pattern: /zomato|swiggy|restaurant|cafe/i, category: "food" },

  // Transportation
  { pattern: /uber|ola|fuel|petrol|diesel/i, category: "transportation" },

  // Utilities & bills
  {
    pattern: /electricity|power|water|gas|internet|phone/i,
    category: "utilities",
  },
  { pattern: /bank fee|late fee|service charge/i, category: "bills" },

  // Income
  { pattern: /salary|payroll/i, category: "salary" },
  { pattern: /investment|mutual fund|sip/i, category: "investments" },
];

/* ------------------------------------------------------------ */
/* Categorization                                                */
/* ------------------------------------------------------------ */
export async function categorizeTransactions(
  transactions: CategorizeInput[]
): Promise<CategorizeInput[]> {
  if (transactions.length === 0) return transactions;

  const result = transactions.map((t) => ({ ...t }));

  /* ------------------------------------------------------------ */
  /* Deterministic pass                                           */
  /* ------------------------------------------------------------ */
  result.forEach((t) => {
    const rule = MERCHANT_RULES.find((r) =>
      r.pattern.test(t.description)
    );

    if (rule) {
      t.category = rule.category;
    }
  });

  /* ------------------------------------------------------------ */
  /* Collect original indices needing AI                          */
  /* ------------------------------------------------------------ */
  const aiPayload = result
    .map((t, index) => ({ ...t, index }))
    .filter((t) => !t.category);

  if (aiPayload.length === 0) return result;

  /* ------------------------------------------------------------ */
  /* OpenAI fallback                                              */
  /* ------------------------------------------------------------ */
  try {
    const res = await aiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You classify financial transactions.

IMPORTANT:
- You MUST return a category ID, not a label.
- Choose ONLY from the allowed list.
- If unsure, use "other-expense" or "other-income".

Expense categories:
${EXPENSE_CATEGORIES.join(", ")}

Income categories:
${INCOME_CATEGORIES.join(", ")}
`,
        },
        {
          role: "user",
          content: `
Transactions (with original indices):
${JSON.stringify(aiPayload, null, 2)}

Return ONLY JSON:
{
  "categories": [
    { "index": number, "category": string }
  ]
}
`,
        },
      ],
    });

    const parsed = JSON.parse(
      res.choices[0].message.content ?? "{}"
    );

    parsed.categories?.forEach(
      (c: { index: number; category: string }) => {
        if (result[c.index]) {
          result[c.index].category = c.category;
        }
      }
    );

    return result;
  } catch (error) {
    console.error("[categorize] OpenAI error", error);

    return result.map((t) => ({
      ...t,
      category:
        t.category ??
        (t.type === "INCOME"
          ? "other-income"
          : "other-expense"),
    }));
  }
}
