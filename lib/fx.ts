// Live mid-market FX rates (units per 1 USD) — multi-source, zero auth.
//
// Sources:
//   • Frankfurter (api.frankfurter.app) — ECB reference data for EUR/GBP
//   • Open Exchange Rates (open.er-api.com) — 150+ currencies including KES
//   • USDC is a USD-pegged stablecoin, so 1 USDC = 1 USD by definition.
//
// Each currency gets the best available source. If any source is unreachable
// or takes longer than 4 seconds, we fall back to a static rate so the app
// never freezes.

const FALLBACK: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  KES: 130,
  USDC: 1,
};

export async function getLiveUsdRates(): Promise<Record<string, number>> {
  // Fire both sources in parallel with 4-second timeouts
  const [frankfurter, erApi] = await Promise.allSettled([
    fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    }).then((r) => r.json()),
    fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    }).then((r) => r.json()),
  ]);

  const f = frankfurter.status === "fulfilled" ? frankfurter.value?.rates : null;
  const e = erApi.status === "fulfilled" ? erApi.value?.rates : null;

  return {
    USD: 1,
    EUR: f?.EUR ?? FALLBACK.EUR,      // ECB reference
    GBP: f?.GBP ?? FALLBACK.GBP,      // ECB reference
    KES: e?.KES ?? FALLBACK.KES,      // open.er-api.com
    USDC: 1,                          // stablecoin peg
  };
}