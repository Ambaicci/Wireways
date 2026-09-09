import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { observeWorld } from "@/wic/observe";
import { buildBriefing } from "@/wic/intelligence";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { formatErrorResponse, AuthenticationError, DatabaseError } from "@/lib/errors";

// WIC Briefing endpoint: observe the world, then reason over it.
export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting (Protects against expensive AI context-generation abuse)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    await checkRateLimit(`ip:${ip}`, "api");

    // 2. Session Validation
    const session = await verifySession();
    if (!session) {
      throw new AuthenticationError("Unauthorized access to WIC briefing.");
    }

    // 3. Fetch User Data (CRITICAL FIX: Postgres uses $1, not ?)
    const userRes = await db.execute("SELECT name FROM users WHERE id = $1", [session.userId]);
    
    if (userRes.rows.length === 0) {
      throw new DatabaseError("User not found for valid session.");
    }

    const firstName = userRes.rows[0].name 
      ? String(userRes.rows[0].name).split(" ")[0] 
      : undefined;

    // 4. Observe and Build
    const world = await observeWorld(session.userId);
    const briefing = buildBriefing(world, firstName);
    
    return NextResponse.json({ 
      success: true, 
      briefing 
    });

  } catch (error: unknown) {
    // 5. Unified Error Handling (Prevents stack trace leakage)
    const { response } = formatErrorResponse(error);
    return response;
  }
}