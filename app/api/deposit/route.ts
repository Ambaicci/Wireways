import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Check Authentication
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }
    const userId = session.userId;

    // 2. Parse and Validate
    const body = await req.json();
    const { amount, currency, method } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!currency || !method) {
      return NextResponse.json({ success: false, error: "Missing currency or method" }, { status: 400 });
    }

    const depositAmount = Number(amount);
    const cleanCurrency = currency.toUpperCase();

    // 3. Update Wallet Balance
    const walletCheck = await db.execute(
      "SELECT id FROM wallets WHERE user_id = $1 AND currency = $2",
      [userId, cleanCurrency]
    );

    if (walletCheck.rows.length === 0) {
      // Create wallet
      await db.execute(
        "INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3)",
        [userId, cleanCurrency, depositAmount]
      );
    } else {
      // Update wallet
      await db.execute(
        "UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND currency = $3",
        [depositAmount, userId, cleanCurrency]
      );
    }

    // 4. Record Transaction
    const railMap: Record<string, string> = {
      bank: "Bank Transfer",
      card: "Card Payment",
      mobile: "Mobile Money",
      agent: "Mobile Money",
    };
    const rail = railMap[method] || method;

    await db.execute(
      `INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, transaction_uuid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, `Deposit via ${rail}`, "in", depositAmount, "Completed", rail, cleanCurrency, randomUUID()]
    );

    // 5. Success
    return NextResponse.json({
      success: true,
      message: "Deposit successful",
      amount: depositAmount,
      currency: cleanCurrency,
    });

  } catch (error: any) {
    console.error("DEPOSIT ERROR:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Database error occurred"
      },
      { status: 500 }
    );
  }
}