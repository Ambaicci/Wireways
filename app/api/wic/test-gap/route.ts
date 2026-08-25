import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

// Idempotent test injector: always leaves exactly ONE test gap.
export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  try {
    // Clear any previous test rolls first
    await db.execute(
      "DELETE FROM wire_rolls WHERE user_id = ? AND name = ?",
      [session.userId, "London Office Rent"]
    );
    // Insert exactly one
    await db.execute(
      "INSERT INTO wire_rolls (user_id, name, recipient, currency, amount, frequency, next_run_date, rail, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [session.userId, "London Office Rent", "Canary Wharf Holdings", "GBP", 50000, "monthly", "2026-08-22", "SWIFT gpi", "active"]
    );
    return NextResponse.json({ success: true, message: "Exactly one test gap active." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}