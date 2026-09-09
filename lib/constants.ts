// ─── Single Source of Truth for Business Rules ───────────────
// Centralizing these prevents hardcoded data scattering across the codebase.

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "USDC", "KES"] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"] as const;
export type ValidFrequency = typeof VALID_FREQUENCIES[number];

export const VALID_RAILS = ["ACH", "Wire", "SEPA", "M-Pesa", "Internal FX", "Crypto"] as const;
export type ValidRail = typeof VALID_RAILS[number];

// ─── Currency Symbols & Formatting ─────────────────────────
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  USDC: "$",
  KES: "KSh ",
};

// Helper to check if a value is a supported currency (case-insensitive)
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
}

// Helper to check if a value is a valid frequency
export function isValidFrequency(frequency: string): frequency is ValidFrequency {
  return VALID_FREQUENCIES.includes(frequency.toLowerCase() as ValidFrequency);
}

// ─── Deterministic Financial Formatting ────────────────────
// CRITICAL: In fintech, we cannot rely on the server's default locale 
// (which might format 1,000 as 1.000 in Europe, changing the value).
// We enforce standard US-style formatting for internal consistency.
export function formatCurrency(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const formatted = amount.toLocaleString("en-US", { 
    minimumFractionDigits: amount < 100 ? 2 : 0, 
    maximumFractionDigits: amount < 100 ? 2 : 0 
  });
  return `${sym}${formatted}`;
}

export function formatCompactUsd(amount: number): string {
  if (amount >= 1_000_000) return "$" + (amount / 1_000_000).toFixed(1) + "M";
  if (amount >= 1_000) return "$" + Math.round(amount / 1_000) + "K";
  return "$" + Math.round(amount);
}