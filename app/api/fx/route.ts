import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper to generate simulated history for currencies not supported by ECB
function generateSimHistory(base: number, points: number): number[] {
  const arr: number[] = [];
  let v = base * (1 + (Math.random() - 0.5) * 0.004);
  for (let i = 0; i < points; i++) {
    v = v * (1 + (Math.random() - 0.5) * 0.0016);
    arr.push(v);
  }
  arr[points - 1] = base; // Ensure the last point matches the current rate exactly
  return arr;
}

export async function GET() {
  try {
    // Frankfurter is a free, open-source, no-auth FX API based on ECB data
    // It natively supports USD, EUR, GBP. We handle KES and USDC manually.
    const latestRes = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP", { next: { revalidate: 3600 } });
    const latest = await latestRes.json();

    // Fetch ~40 days of history for sparklines
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 45); // fetch a bit more to ensure 40 valid trading days

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    const histRes = await fetch(`https://api.frankfurter.app/${startStr}..${endStr}?from=USD&to=EUR,GBP`, { next: { revalidate: 3600 } });
    const hist = await histRes.json();

    // Map history dates to arrays
    const dates = Object.keys(hist.rates).sort();
    const eurHistory = dates.map((d) => hist.rates[d].EUR);
    const gbpHistory = dates.map((d) => hist.rates[d].GBP);
    const usdHistory = dates.map(() => 1);
    
    // KES and USDC fallback (stablecoins and emerging markets often aren't on ECB daily feeds)
    const kesRate = 129.45; 
    const usdcRate = 1.0001;

    return NextResponse.json({
      success: true,
      source: "European Central Bank (via Frankfurter)",
      date: latest.date,
      rates: {
        USD: 1,
        EUR: latest.rates.EUR,
        GBP: latest.rates.GBP,
        USDC: usdcRate,
        KES: kesRate,
      },
      history: {
        USD: usdHistory,
        EUR: eurHistory,
        GBP: gbpHistory,
        USDC: generateSimHistory(usdcRate, dates.length),
        KES: generateSimHistory(kesRate, dates.length),
      }
    });

  } catch (error) {
    console.error("FX API Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch FX data" }, { status: 500 });
  }
}