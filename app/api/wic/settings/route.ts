import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================================
// WIC Settings Gateway
// GET  /api/wic/settings → returns the user's stored settings
// POST /api/wic/settings → patches one or more whitelisted keys
// Settings live on the users table itself.
// ============================================================

const SETTING_COLUMNS = [
  "wic_autonomy",
  "wic_memory_on",
  "wic_show_reasoning",
  "privacy_default",
  "reporting_currency",
  "liquidity_target_days",
  "fx_alert_threshold_pct",
  "notify_funding_gaps",
  "notify_fx_opportunities",
  "notify_weekly_briefing",
  "timezone",
  "default_wallet",
] as const;

const AUTONOMY_LEVELS = ["advise", "draft", "auto"];
const VALID_CURRENCIES = ["USD", "EUR", "GBP", "KES", "USDC"];

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Include account_type (read-only) for the UI to display
    const res = await db.execute(
     `SELECT ${SETTING_COLUMNS.join(", ")}, account_type, email, name, company, avatar_url FROM users WHERE id = ?`,
      [session.userId]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const row = res.rows[0] as Record<string, any>;
    const settings: Record<string, any> = {};
    for (const col of SETTING_COLUMNS) settings[col] = row[col];
        settings.account_type = row.account_type; // Read-only for display
    settings.email = row.email;
    settings.name = row.name;
    settings.company = row.company;
    settings.avatar_url = row.avatar_url || "";
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("WIC settings GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load settings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const entries = Object.entries(body).filter(([k]) =>
      (SETTING_COLUMNS as readonly string[]).includes(k)
    );
    if (entries.length === 0) {
      return NextResponse.json({ success: false, message: "No valid settings provided." }, { status: 400 });
    }

    for (const [key, raw] of entries) {
      let value: any = raw;

      if (key === "wic_autonomy") {
        value = AUTONOMY_LEVELS.includes(String(raw)) ? String(raw) : "advise";
      } else if (key === "reporting_currency" || key === "default_wallet") {
        value = VALID_CURRENCIES.includes(String(raw).toUpperCase()) ? String(raw).toUpperCase() : "USD";
      } else if (key === "timezone") {
        value = String(raw).trim() || "UTC";
      } else if (key === "liquidity_target_days" || key === "fx_alert_threshold_pct") {
        const n = Number(raw);
        value = Number.isFinite(n) ? n : key === "liquidity_target_days" ? 14 : 2.0;
      } else {
        value = raw === true || raw === 1 || raw === "1" ? 1 : 0;
      }

      await db.execute(`UPDATE users SET ${key} = ? WHERE id = ?`, [value, session.userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WIC settings POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to save settings." }, { status: 500 });
  }
}