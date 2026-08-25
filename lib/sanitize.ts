// ============================================================
// Wireways Input Sanitization Layer
// ============================================================
// Protects against: XSS injection, excessive input lengths,
// invalid numeric values, and control characters.
// ============================================================

const MAX_TEXT_LENGTH = 500;
const MAX_NAME_LENGTH = 100;
const MAX_PROMPT_LENGTH = 1000;
const MAX_AMOUNT = 99_999_999;

/**
 * Strips HTML tags, control characters, and trims length.
 * Safe for: names, descriptions, recipients.
 */
export function sanitizeText(input: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (!input || typeof input !== "string") return "";
  
  return input
    // Remove HTML/script tags
    .replace(/<[^>]*>/g, "")
    // Remove javascript: and data: URIs
    .replace(/(javascript|data|vbscript):/gi, "")
    // Remove control characters (except newline/tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Trim and limit length
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes a name field (recipient, method name, roll name).
 */
export function sanitizeName(input: string): string {
  return sanitizeText(input, MAX_NAME_LENGTH);
}

/**
 * Sanitizes an AI prompt before processing.
 */
export function sanitizePrompt(input: string): string {
  return sanitizeText(input, MAX_PROMPT_LENGTH);
}

/**
 * Validates and clamps a numeric amount.
 * Returns 0 if invalid.
 */
export function sanitizeAmount(input: any): number {
  const num = parseFloat(input);
  if (isNaN(num) || num < 0) return 0;
  return Math.min(num, MAX_AMOUNT);
}

/**
 * Validates a currency code against allowed values.
 */
const VALID_CURRENCIES = ["USD", "EUR", "GBP", "KES", "USDC"];
export function sanitizeCurrency(input: string): string {
  const upper = (input || "").toUpperCase().trim();
  return VALID_CURRENCIES.includes(upper) ? upper : "USD";
}