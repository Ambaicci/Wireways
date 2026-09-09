import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { formatErrorResponse, AuthenticationError, ValidationError } from "@/lib/errors";

// Legacy column guard — kept minimal; new schema changes belong in lib/migrate.ts.
let columnsEnsured = false;
async function ensureColumns() {
  if (columnsEnsured) return;
  const cols = [
    "single_use INTEGER DEFAULT 0",
    "purpose TEXT",
    "monthly_limit REAL",
    "currency TEXT",
  ];
  for (const c of cols) {
    try { 
      // Note: Postgres uses IF NOT EXISTS for safe idempotent migrations
      await db.execute(`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS ${c}`); 
    } catch {}
  }
  columnsEnsured = true;
}

function cleanText(v: any, maxLen: number): string {
  return String(v ?? "").trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (Protects against automated abuse of payment method creation)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    await checkRateLimit(`ip:${ip}`, "api");

    // 2. Session Validation
    const session = await verifySession();
    if (!session) {
      throw new AuthenticationError("Unauthorized access to payment methods.");
    }
    
    await ensureColumns();

    let b: any;
    try {
      b = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON payload.");
    }

    const { id } = b;
    const name = cleanText(b.name, 80);
    const type = cleanText(b.type, 30);
    const details = cleanText(b.details, 200);
    const singleUse = !!b.single_use;
    const purpose = cleanText(b.purpose, 120);
    const monthlyLimit = b.monthly_limit === null || b.monthly_limit === undefined || b.monthly_limit === ""
      ? null
      : Number(b.monthly_limit);
    const currency = cleanText(b.currency, 8).toUpperCase();

    // 3. Strict Validation
    if (!name || !type || !details) {
      throw new ValidationError("Name, type, and details are required.");
    }
    if (monthlyLimit !== null && (!isFinite(monthlyLimit) || monthlyLimit < 0)) {
      throw new ValidationError("Monthly limit must be a positive number.");
    }
    const numericId = Number(id);
    if (id !== undefined && id !== null && id !== "" && (!Number.isInteger(numericId) || numericId <= 0)) {
      throw new ValidationError("Invalid method reference.");
    }

    // 4. Database Execution (CRITICAL FIX: Postgres uses $1, $2, etc., NOT ?)
    if (numericId > 0) {
      await db.execute(
        `UPDATE payment_methods 
         SET name = $1, type = $2, details = $3, single_use = $4, purpose = $5, monthly_limit = $6, currency = $7 
         WHERE id = $8 AND user_id = $9`,
        [name, type, details, singleUse ? 1 : 0, purpose || null, monthlyLimit, currency || null, numericId, session.userId]
      );
    } else {
      await db.execute(
        `INSERT INTO payment_methods (user_id, type, name, details, single_use, purpose, monthly_limit, currency) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [session.userId, type, name, details, singleUse ? 1 : 0, purpose || null, monthlyLimit, currency || null]
      );
    }
    
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    // 5. Unified Error Handling
    const { response } = formatErrorResponse(error);
    return response;
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    await checkRateLimit(`ip:${ip}`, "api");

    // 2. Session Validation
    const session = await verifySession();
    if (!session) {
      throw new AuthenticationError("Unauthorized access to payment methods.");
    }

    const raw = req.nextUrl.searchParams.get("id");
    const id = Number(raw);
    if (!raw || !Number.isInteger(id) || id <= 0) {
      throw new ValidationError("Invalid method reference.");
    }

    // 3. Database Execution (CRITICAL FIX: Postgres uses $1, $2)
    await db.execute(
      "DELETE FROM payment_methods WHERE id = $1 AND user_id = $2", 
      [id, session.userId]
    );
    
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    // 4. Unified Error Handling
    const { response } = formatErrorResponse(error);
    return response;
  }
}