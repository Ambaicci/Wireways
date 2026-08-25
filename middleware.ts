import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "wireways-super-secret-key-do-not-share";
const key = new TextEncoder().encode(secretKey);

const protectedRoutes = [
  "/dashboard",
  "/wallets",
  "/payments",
  "/payment-links",
  "/payment-methods",
  "/settings",
];

const authRoutes = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get("session")?.value; 

  let userId: number | null = null;
  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, key, { algorithms: ["HS256"] });
      userId = payload?.sub ? Number(payload.sub) : null;
    } catch {
      userId = null;
    }
  }

  const isProtected = protectedRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAuth = authRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // No valid session on a protected route -> go to login AND KILL THE BAD COOKIE
  if (isProtected && !userId) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session"); // 👈 THE GHOST BUSTER STRIKES AT THE EDGE
    return response;
  }

  // Logged in but visiting auth pages -> go to dashboard
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
    "/login",
    "/register",
  ],
};