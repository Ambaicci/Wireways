import { NextRequest, NextResponse } from "next/server";

// Temporary mock rates for Phase 1 testing (We will hook this to your live FX fetcher next)
const MOCK_FX_RATES: Record<string, number> = {
  ETB: 1,       // Base
  USD: 0.018,   // Example: 1 ETB = 0.018 USD
  KES: 2.35,    // Example: 1 ETB = 2.35 KES
  JPY: 2.75,    // Example: 1 ETB = 2.75 JPY
  EUR: 0.016,
  GBP: 0.014,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, baseCurrency, targetCurrency } = body;

    if (!amount || !baseCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: "Missing amount, baseCurrency, or targetCurrency" },
        { status: 400 }
      );
    }

    const baseRate = MOCK_FX_RATES[baseCurrency.toUpperCase()] || 1;
    const targetRate = MOCK_FX_RATES[targetCurrency.toUpperCase()] || 1;
    
    // The Calibrics Math: Convert to base, then to target
    const calibratedAmount = (amount / baseRate) * targetRate;
    const effectiveRate = targetRate / baseRate;

    return NextResponse.json({
      success: true,
      original: { amount, currency: baseCurrency },
      calibrated: { 
        amount: Number(calibratedAmount.toFixed(2)), 
        currency: targetCurrency.toUpperCase() 
      },
      effectiveRate,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Calibrics Engine Error:", error);
    return NextResponse.json(
      { error: "Failed to calibrate price" },
      { status: 500 }
    );
  }
}