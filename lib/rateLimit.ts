// Simple in-memory rate limiter (per-user, per-minute).
// In production you'd use Redis, but for a single-server app this is fine.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

const store = new Map<number, { count: number; resetAt: number }>();

export function checkRateLimit(userId: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}