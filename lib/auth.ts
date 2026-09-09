import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AuthenticationError } from "@/lib/errors";
import bcrypt from "bcryptjs";

// ─── Configuration ─────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("❌ SESSION_SECRET environment variable is required");
}
const secretKey = new TextEncoder().encode(SESSION_SECRET);

// Fintech Best Practice: Shorter absolute session duration (24 hours)
// Consider implementing a "remember me" or sliding session later if needed.
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ─── Password Policy ───────────────────────────────────────────
// Added special character requirement (?=.*[!@#$%^&*])
export const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

export function validatePassword(password: string): boolean {
  return passwordPolicy.test(password);
}

// ─── Session Helpers ───────────────────────────────────────────
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, secretKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    throw new AuthenticationError("Invalid or expired session");
  }
}

// ─── Password Helpers ──────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  // Note: bcryptjs is pure JS and slower. Consider native 'bcrypt' or 'argon2' for production.
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

// ─── Session Management ────────────────────────────────────────
export async function createSession(userId: number) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({ sub: userId, exp: expiresAt.getTime() });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "strict" as const, // CRITICAL: Prevents CSRF attacks
    path: "/",
  };

  const cookieStore = await cookies();
  cookieStore.set("session", session, cookieOptions);

  return { userId, expiresAt };
}

export async function verifySession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  if (!cookie) return null;

  try {
    const decoded = await decrypt(cookie);
    if (!decoded?.sub) return null;

    const userId = Number(decoded.sub);
    if (isNaN(userId) || userId <= 0) return null;

    // Verify user still exists and is active (add 'status = active' if you have that column)
    const result = await db.query`SELECT id FROM users WHERE id = ${userId}`;
    if (result.rows.length === 0) return null;

    return { userId };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  // CRITICAL: Must match creation options to ensure the browser actually deletes it
  cookieStore.delete("session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}