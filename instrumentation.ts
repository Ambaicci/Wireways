export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // ─── 1. Global Unhandled Rejection Handler ─────────────────
    // Catches any rogue Promise rejections that slip past try/catch blocks.
    // Prevents silent failures and provides a clear audit trail.
    process.on("unhandledRejection", (reason, promise) => {
      console.error("🚨 [FATAL] Unhandled Rejection at:", promise, "reason:", reason);
      // In a true Tier-1 setup, you would also send this to Sentry/Datadog here:
      // Sentry.captureException(reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("🚨 [FATAL] Uncaught Exception:", error);
      // Sentry.captureException(error);
      // Graceful shutdown could be initiated here
    });

    // ─── 2. Database Migrations ────────────────────────────────
    const { runMigrations } = await import("@/lib/migrate");
    try {
      console.log("🔄 Initializing database schema...");
      await runMigrations();
      console.log("✅ Database schema verified and up to date.");
    } catch (e) {
      console.error("❌ [STARTUP] Database migrations failed:", e);
      // We allow the server to boot so health checks can still respond, 
      // but routes will surface database errors loudly rather than silently.
    }
  }
}