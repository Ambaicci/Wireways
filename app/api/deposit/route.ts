import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, method } = body;

    // 1. Validate the input
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid deposit amount" },
        { status: 400 }
      );
    }

    if (!currency || !method) {
      return NextResponse.json(
        { error: "Missing currency or payment method" },
        { status: 400 }
      );
    }

    // 2. Simulate realistic network latency (like talking to Stripe/Flutterwave)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Generate a realistic Payment Intent (This is where real gateway logic goes)
    const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
    const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;

    // 4. Return the secure payload to the frontend
    return NextResponse.json({
      success: true,
      paymentIntentId,
      clientSecret,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      method,
      message: "Deposit initiated successfully. Ready for payment processing.",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Deposit API Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate deposit. Please try again." },
      { status: 500 }
    );
  }
}