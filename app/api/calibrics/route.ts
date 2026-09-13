import { NextRequest, NextResponse } from "next/server";

// CORS headers to allow external websites to use the Calibrics API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle browser preflight (OPTIONS) requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, baseCurrency, targetCurrency } = body;

    if (!amount || !baseCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: "Missing amount, baseCurrency, or targetCurrency" },
        { status: 400, headers: corsHeaders }
      );
    }

    const base = baseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();

    // Fetch live rates from a free, no-key-required API
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      throw new Error("Failed to fetch live exchange rates");
    }

    const data = await response.json();
    const liveRate = data.rates[target];

    if (!liveRate) {
      return NextResponse.json(
        { error: `Target currency ${target} not supported by live rates` },
        { status: 400, headers: corsHeaders }
      );
    }

    // The Calibrics Math: amount * liveRate
    const calibratedAmount = amount * liveRate;

    return NextResponse.json({
      success: true,
      original: { amount, currency: base },
      calibrated: { 
        amount: Number(calibratedAmount.toFixed(2)), 
        currency: target 
      },
      effectiveRate: liveRate,
      timestamp: new Date().toISOString(),
      source: "Live ExchangeRate-API"
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Calibrics Engine Error:", error);
    return NextResponse.json(
      { error: "Failed to calibrate price. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}