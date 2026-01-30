export interface ScanReceiptResult {
  amount: number;
  date: Date;
  description: string;
  merchantName: string;
  category: string;
}

/* -------------------------------------------------------------------------- */
/* Scan Receipt with OCR.space                                                 */
/* -------------------------------------------------------------------------- */

export async function scanReceiptWithOCRSpace(
  file: File
): Promise<ScanReceiptResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OCR_SPACE_API_KEY not configured. Please add it to your environment variables."
    );
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`OCR API request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();

    if (json.IsErroredOnProcessing) {
      throw new Error(
        `OCR processing error: ${
          json.ErrorMessage?.[0] || "Unknown error"
        }`
      );
    }

    const text: string = json?.ParsedResults?.[0]?.ParsedText ?? "";

    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from the receipt.");
    }

    console.log("OCR extracted text:", text);

    return await extractReceiptDataWithAI(text);
  } catch (error) {
    console.error("Receipt scanning error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to scan receipt.");
  }
}

/* -------------------------------------------------------------------------- */
/* AI Extraction (with regex fallback)                                         */
/* -------------------------------------------------------------------------- */

async function extractReceiptDataWithAI(
  ocrText: string
): Promise<ScanReceiptResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return extractReceiptDataWithRegex(ocrText);
  }

  const openai = await import("openai").then((m) => m.default);
  const client = new openai({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extract receipt data (Indian receipts only).

Return ONLY valid JSON in this format:
{
  "amount": 0,
  "date": "2026-01-29",
  "merchantName": "Store Name",
  "description": "Brief description",
  "category": "Food & Dining"
}`,
        },
        {
          role: "user",
          content: ocrText,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);

    return {
      amount:
        typeof parsed.amount === "number" && parsed.amount > 0
          ? parsed.amount
          : 0,
      date: parsed.date ? new Date(parsed.date) : new Date(),
      merchantName: parsed.merchantName || "Unknown Merchant",
      description: parsed.description || "Receipt purchase",
      category: parsed.category || "Other",
    };
  } catch (error) {
    console.warn("AI extraction failed, using regex fallback:", error);
    return extractReceiptDataWithRegex(ocrText);
  }
}

/* -------------------------------------------------------------------------- */
/* Regex Extraction                                                            */
/* -------------------------------------------------------------------------- */

function extractReceiptDataWithRegex(text: string): ScanReceiptResult {
  const normalized = text
    .replace(/\r?\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  /* --------------------------- Amount (FINAL TOTAL) ------------------------- */

  const amountPatterns = [
    /(?:eat[-\s]?in\s*total|grand\s*total|total\s*amount|total)[:\s₹]*([\d,]+(?:\.\d{1,2})?)/gi,
  ];

  let amount = 0;
  let match: RegExpExecArray | null;

  for (const pattern of amountPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const value = Number(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0) {
        amount = value; // last total wins
      }
    }
  }

  /* ------------------------------- Date ------------------------------------ */

  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  ];

  let date = new Date();
  for (const pattern of datePatterns) {
    const m = normalized.match(pattern);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) {
        date = d;
        break;
      }
    }
  }

  /* ---------------------------- Merchant Name ------------------------------ */

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^[\d\s\-\/]+$/.test(l));

  const merchantName = lines[0] || "Unknown Merchant";

  /* ----------------------------- Description -------------------------------- */

  const description =
    lines.slice(0, 2).join(" ") || "Receipt purchase";

  return {
    amount,
    date,
    merchantName,
    description: description.substring(0, 100),
    category: "Other",
  };
}
