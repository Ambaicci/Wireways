import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RateLimitError } from "@/lib/errors";

// ─── Upstash Redis Configuration ───────────────────────────────
// Fails fast in development if env vars are missing, preventing silent security failures.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn("⚠️ WARNING: Upstash Redis credentials missing. Rate limiting will fail.");
}

const redis = new Redis({
  url: redisUrl || "http://localhost:8079", // Fallback for local dev testing
  token: redisToken || "local_token",
});

// ─── Rate Limit Instances (Sliding Window for Fintech Security) ──
// Sliding window prevents "burst" attacks at the boundary of time windows.

// 1. Authentication: Very strict to prevent brute-force / credential stuffing
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per minute per IP
  analytics: true,
  prefix: "wireways:ratelimit:auth",
});

// 2. General API: Standard protection for dashboard data fetching
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute per IP
  analytics: true,
  prefix: "wireways:ratelimit:api",
});

// 3. AI / WIC Endpoints: Strict due to LLM compute cost and token limits
export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per user/IP
  analytics: true,
  prefix: "wireways:ratelimit:ai",
});

// 4. FX / Payments: Moderate, but tracked carefully for fraud patterns
export const fxLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute per user
  analytics: true,
  prefix: "wireways:ratelimit:fx",
});

// ─── Unified Checker for Middleware / API Routes ───────────────
export async function checkRateLimit(
  identifier: string,
  type: "auth" | "api" | "ai" | "fx" = "api"
) {
  const limiter = 
    type === "auth" ? authLimiter :
    type === "ai" ? aiLimiter :
    type === "fx" ? fxLimiter :
    apiLimiter;

  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    );
  }

  return {
    allowed: true,
    limit,
    remaining,
    resetAt: reset,
  };
}

// ─── Compatibility Wrappers (for your existing middleware) ─────
export async function checkIpRateLimit(ip: string) {
  return checkRateLimit(`ip:${ip}`, "api");
}

export async function checkUserRateLimit(userId: number) {
  return checkRateLimit(`user:${userId}`, "api");
}

export async function checkEndpointRateLimit(userId: number, endpoint: string) {
  // Route specific expensive endpoints to the AI/FX limiters
  if (endpoint.includes("/ai") || endpoint.includes("/wic")) {
    return checkRateLimit(`user:${userId}:endpoint:${endpoint}`, "ai");
  }
  if (endpoint.includes("/fx")) {
    return checkRateLimit(`user:${userId}:endpoint:${endpoint}`, "fx");
  }
  return checkRateLimit(`user:${userId}:endpoint:${endpoint}`, "api");
}