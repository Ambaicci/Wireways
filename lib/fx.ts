"server-only";

// Live mid-market FX rates (units per 1 USD) — multi-source, zero auth.
//
// Sources:
//   • Frankfurter (api.frankfurter.app) — ECB reference data for EUR/GBP
//   • Open Exchange Rates (open.er-api.com) — 150+ currencies including KES
//   • USDC is a USD-pegged stablecoin, so 1 USDC = 1 USD by definition.

const FALLBACK: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  KES: 130,
  USDC: 1,
};

// ─── Spread Configuration ──────────────────────────────────────
// Fintech Best Practice: Always apply a small markup to mid-market rates
// to protect against micro-volatility and cover operational costs.
const FX_SPREAD_PERCENTAGE = 0.015; // 1.5%

export function applyBuySpread(rate: number): number {
  return Math.round((rate * (1 + FX_SPREAD_PERCENTAGE) + Number.EPSILON) * 10000) / 10000;
}

export function applySellSpread(rate: number): number {
  return Math.round((rate * (1 - FX_SPREAD_PERCENTAGE) + Number.EPSILON) * 10000) / 10000;
}

// ─── Live Rate Fetcher ─────────────────────────────────────────
export async function getLiveUsdRates(): Promise<Record<string, number>> {
  const [frankfurter, erApi] = await Promise.allSettled([
    fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP", {
      next: { revalidate: 60 }, 
      signal: AbortSignal.timeout(4000),
    }).then((r) => r.ok ? r.json() : null),
    fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    }).then((r) => r.ok ? r.json() : null),
  ]);

  const f = frankfurter.status === "fulfilled" && frankfurter.value ? frankfurter.value.rates : null;
  const e = erApi.status === "fulfilled" && erApi.value ? erApi.value.rates : null;

  return {
    USD: 1,
    EUR: (typeof f?.EUR === "number" ? f.EUR : FALLBACK.EUR),
    GBP: (typeof f?.GBP === "number" ? f.GBP : FALLBACK.GBP),
    KES: (typeof e?.KES === "number" ? e.KES : FALLBACK.KES),
    USDC: 1,
  };
}

// ─── Helper for UI: Get rate with spread applied ───────────────
export async function getRateWithSpread(currency: string, type: "buy" | "sell"): Promise<number> {
  const rates = await getLiveUsdRates();
  const midMarketRate = rates[currency] || FALLBACK[currency] || 1;
  return type === "buy" ? applyBuySpread(midMarketRate) : applySellSpread(midMarketRate);
}