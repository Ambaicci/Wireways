import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { observeWorld } from "@/wic/observe";
import { checkRateLimit } from "@/lib/rateLimit";
import { formatErrorResponse, AuthenticationError } from "@/lib/errors";

// Diagnostic endpoint: reveals WIC's raw world model for the signed-in user.
export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting (Protects against automated scraping/DoS)
    // We use the IP for rate limiting here, but you could also tie it to the userId after verification.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    await checkRateLimit(`ip:${ip}`, "api");

    // 2. Session Validation
    const session = await verifySession();
    if (!session) {
      throw new AuthenticationError("Unauthorized access to WIC observer.");
    }

    // 3. Execute Business Logic
    const world = await observeWorld(session.userId);
    
    return NextResponse.json({ 
      success: true, 
      world 
    });

  } catch (error: unknown) {
    // 4. Unified Error Handling (Prevents stack trace leakage)
    const { response } = formatErrorResponse(error);
    return response;
  }
}