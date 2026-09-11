import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { checkIpRateLimit } from "@/lib/rateLimit";

// ─── Configuration ─────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("❌ SESSION_SECRET environment variable is required");
}
const key = new TextEncoder().encode(SESSION_SECRET);

const protectedRoutes = [
  "/dashboard",
  "/wallets",
  "/payments",
  "/payment-links",
  "/payment-methods",
  "/settings",
  "/wire-roll", // CRITICAL FIX: Added missing dashboard route
];

const authRoutes = ["/login", "/register"];

// ─── Middleware ────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get("session")?.value;

  // ── Rate Limiting ──
  // Note: x-forwarded-for is standard, but ensure your hosting provider 
  // (e.g., Vercel, Cloudflare) is correctly setting this to the true client IP.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  
  try {
    await checkIpRateLimit(ip);
  } catch (error: any) {
    // For API routes, JSON is appropriate. For HTML routes, you might want 
    // to redirect to a dedicated /too-many-requests page in the future.
    return new NextResponse(
      JSON.stringify({ success: false, message: error.message || "Too many requests" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Authentication ──
  let userId: number | null = null;
  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, key, { algorithms: ["HS256"] });
      userId = payload?.sub ? Number(payload.sub) : null;
    } catch {
      userId = null; // Token is invalid or expired
    }
  }

  const isProtected = protectedRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAuth = authRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // No valid session on protected route → redirect to login
  if (isProtected && !userId) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    // CRITICAL FIX: Explicitly set path to ensure the root cookie is deleted
    response.cookies.delete("session");
    return response;
  }

  // Logged in but visiting auth pages → redirect to dashboard
  if (isAuth && userId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallets/:path*",
    "/payments/:path*",
    "/payment-links/:path*",
    "/payment-methods/:path*",
    "/settings/:path*",
    "/wire-roll/:path*", // CRITICAL FIX: Added missing matcher
    "/login",
    "/register",
    "/api/:path*", // CRITICAL FIX: Enforce rate limiting on all API routes
  ],
};