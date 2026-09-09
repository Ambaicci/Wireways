import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { detectRecurringPatterns } from "@/lib/wic-suggestions";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch last 90 days of transactions
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const txRes = await db.execute(
      `SELECT name, amount, currency, type, created_at 
       FROM transactions 
       WHERE user_id = $1 AND created_at >= $2
       ORDER BY created_at ASC`,
      [session.userId, cutoff.toISOString()]
    );

    const transactions = txRes.rows.map((r: any) => ({
      name: r.name,
      amount: Number(r.amount),
      currency: r.currency,
      type: r.type,
      createdAt: r.created_at,
    }));

    // 2. Fetch existing wire-rolls
    const rollRes = await db.execute(
      `SELECT recipient FROM wire_rolls WHERE user_id = $1`,
      [session.userId]
    );

    const existingRolls = rollRes.rows.map((r: any) => ({
      recipient: r.recipient,
    }));

    // 3. Fetch batch items from existing rolls
    const batchRes = await db.execute(
      `SELECT wri.recipient 
       FROM wire_roll_items wri
       JOIN wire_rolls wr ON wri.roll_id = wr.id
       WHERE wr.user_id = $1`,
      [session.userId]
    );

    for (const row of batchRes.rows) {
      existingRolls.push({ recipient: (row as any).recipient });
    }

    // 4. Fetch dismissed suggestion IDs
    const dismissedRes = await db.execute(
      `SELECT suggestion_id FROM dismissed_suggestions WHERE user_id = $1`,
      [session.userId]
    );

    const dismissedIds = new Set(dismissedRes.rows.map((r: any) => r.suggestion_id));

    // 5. Run pattern detection
    const suggestions = detectRecurringPatterns(transactions, existingRolls);

    // 6. Filter out dismissed suggestions
    const activeSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

    return NextResponse.json({ success: true, suggestions: activeSuggestions });
  } catch (error: any) {
    console.error("❌ WIC suggestions API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}

// ─── POST: Dismiss a suggestion ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { suggestionId } = await req.json();
    if (!suggestionId) {
      return NextResponse.json({ success: false, message: "Missing suggestionId" }, { status: 400 });
    }

    // Insert dismissal record
    await db.execute(
      `INSERT INTO dismissed_suggestions (user_id, suggestion_id, dismissed_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, suggestion_id) DO NOTHING`,
      [session.userId, suggestionId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Dismiss suggestion error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to dismiss suggestion" },
      { status: 500 }
    );
  }
}