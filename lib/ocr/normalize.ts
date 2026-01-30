/**
 * Normalizes raw OCR text so that:
 * - LLM extraction is more reliable
 * - Regex / parsing works better
 * - Noise from OCR is reduced
 */
export function normalizeOCRText(text: string): string {
  return (
    text
      // Normalize newlines to spaces
      .replace(/\r?\n+/g, " ")

      // Remove non printable chars
      .replace(/[^\x20-\x7E₹]/g, "")

      // Fix common OCR spacing issues
      .replace(/\s{2,}/g, " ")

      // Trim leading/trailing whitespace
      .trim()
  );
}
