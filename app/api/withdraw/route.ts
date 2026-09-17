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
    const { amount, currency, method, recipient } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!currency || !method) {
      return NextResponse.json({ success: false, error: "Missing currency or method" }, { status: 400 });
    }

    const withdrawAmount = Number(amount);
    const cleanCurrency = currency.toUpperCase();

    // 3. Check Wallet Balance
    const walletCheck = await db.execute(
      "SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2",
      [userId, cleanCurrency]
    );

    if (walletCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${cleanCurrency} wallet found. Please add funds first.` },
        { status: 400 }
      );
    }

    const walletId = (walletCheck.rows[0] as any).id;
    const currentBalance = Number((walletCheck.rows[0] as any).balance);

    if (currentBalance < withdrawAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient balance. You have ${currentBalance} ${cleanCurrency} but tried to withdraw ${withdrawAmount} ${cleanCurrency}.` 
        },
        { status: 400 }
      );
    }

    // 4. Deduct from Wallet
    await db.execute(
      "UPDATE wallets SET balance = balance - $1 WHERE id = $2",
      [withdrawAmount, walletId]
    );

    // 5. Record Transaction
    const railMap: Record<string, string> = {
      bank: "Bank Transfer",
      mobile: "Mobile Money",
      card: "Card",
    };
    const rail = railMap[method] || method;
    const recipientName = recipient || "External Account";

    await db.execute(
      `INSERT INTO transactions (user_id, name, type, amount, status, rail, currency, transaction_uuid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, `Withdrawal to ${recipientName}`, "out", withdrawAmount, "Completed", rail, cleanCurrency, randomUUID()]
    );

    // 6. Success
    return NextResponse.json({
      success: true,
      message: "Withdrawal successful",
      amount: withdrawAmount,
      currency: cleanCurrency,
      recipient: recipientName,
    });

  } catch (error: any) {
    console.error("WITHDRAW ERROR:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Database error occurred"
      },
      { status: 500 }
    );
  }
}