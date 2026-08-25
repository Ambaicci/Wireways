import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const secretKey = process.env.SESSION_SECRET || "wireways-super-secret-key-do-not-share";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function createSession(userId: number) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ sub: userId, exp: expiresAt.getTime() });  
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  if (!cookie) return null;

  try {
    const decoded = await decrypt(cookie);
    if (!decoded?.sub) return null;
    const userId = Number(decoded.sub);

    // GHOST BUSTER: Check if the user actually exists in the database
    const check = await db.execute("SELECT id FROM users WHERE id = ?", [userId]);
    if (check.rows.length === 0) {
      // Ghost session! User doesn't exist in the new DB.
      // (Cookies can't be deleted during rendering — returning null
      // ignores the ghost; the next login overwrites it.)
      return null;
    }

    return { userId };
  } catch (error) {
    console.error("Failed to verify session", error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  // Overwrite the cookie with an expired date to force the browser to drop it
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // January 1, 1970
    maxAge: 0,
    sameSite: "lax",
    path: "/",
  });
}