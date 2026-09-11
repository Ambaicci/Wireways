import { db } from "./db";

async function migrate() {
  console.log("🔄 Initializing database schema...");
  console.log("🚀 Running database migrations...");

  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'personal',
        company TEXT,
        reporting_currency TEXT DEFAULT 'USD',
        avatar_url TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Users table ready");

    // Wallets table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        currency TEXT NOT NULL,
        balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
        bank TEXT,
        details TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id)`);
    console.log("✅ Wallets table ready");

    // Transactions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount NUMERIC(20, 8) NOT NULL,
        status TEXT NOT NULL DEFAULT 'Completed',
        rail TEXT,
        currency TEXT NOT NULL,
        idempotency_key TEXT,
        transaction_uuid TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)`);
    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_idempotency ON transactions(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL`);
    console.log("✅ Transactions table ready");

    // Payment methods table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        details TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id)`);
    console.log("✅ Payment methods table ready");

    // Payment links table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_links (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        uuid TEXT UNIQUE NOT NULL,
        amount NUMERIC(20, 8) NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Payment links table ready");

    // Wire rolls table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wire_rolls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        recipient TEXT NOT NULL,
        currency TEXT NOT NULL,
        amount NUMERIC(20, 8) NOT NULL,
        frequency TEXT NOT NULL,
        next_run_date TEXT NOT NULL,
        rail TEXT DEFAULT 'Auto',
        status TEXT DEFAULT 'active',
        auto_run INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_wire_rolls_user_id ON wire_rolls(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_wire_rolls_next_run ON wire_rolls(next_run_date)`);
    console.log("✅ Wire rolls table ready");

    // Wire roll items table (for batch/payroll)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wire_roll_items (
        id SERIAL PRIMARY KEY,
        roll_id INTEGER NOT NULL REFERENCES wire_rolls(id) ON DELETE CASCADE,
        recipient TEXT NOT NULL,
        currency TEXT NOT NULL,
        amount NUMERIC(20, 8) NOT NULL,
        rail TEXT DEFAULT 'Auto'
      )
    `);
    console.log("✅ Wire roll items table ready");

    // Wire roll runs table (execution history)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wire_roll_runs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        roll_id INTEGER NOT NULL REFERENCES wire_rolls(id) ON DELETE CASCADE,
        amount NUMERIC(20, 8) NOT NULL,
        status TEXT NOT NULL,
        rail TEXT,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Wire roll runs table ready");

    // Webhooks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        secret TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Webhooks table ready");

    // AI drafts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_drafts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        uuid TEXT UNIQUE NOT NULL,
        action_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ai_drafts_user_id ON ai_drafts(user_id)`);
    console.log("✅ AI drafts table ready");

    // Conversations table (for AI chat history)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Conversations table ready");

    // API keys table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        publishable_key TEXT NOT NULL,
        secret_key TEXT NOT NULL,
        regenerated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ API keys table ready");

    // User settings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ User settings table ready");

    // ─── NEW: Dismissed suggestions table ───────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dismissed_suggestions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        suggestion_id TEXT NOT NULL,
        dismissed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, suggestion_id)
      )
    `);
    console.log("✅ Dismissed suggestions table ready");

    console.log("🎉 All migrations completed successfully!");
    console.log("✅ Database schema verified and up to date.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}
    // ─── NEW: Universal Identity Registry (UIR) ─────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS universal_identities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        handle TEXT UNIQUE NOT NULL,
        handle_local TEXT NOT NULL,
        handle_domain TEXT NOT NULL DEFAULT 'wireways',
        is_default INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_universal_identities_handle ON universal_identities(handle)`);
    console.log("✅ Universal Identity Registry (UIR) table ready");
migrate();

    // ── NEW: Immutable Double-Entry Ledger ────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id SERIAL PRIMARY KEY,
        journal_id UUID NOT NULL,
        wallet_id INTEGER REFERENCES wallets(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
        amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ledger_journal_id ON ledger_entries(journal_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ledger_wallet_id ON ledger_entries(wallet_id)`);
    console.log("✅ Immutable Ledger table ready");

    // Add journal_id to existing transactions table to link UI to Ledger
    await db.execute(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS journal_id UUID`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_journal_id ON transactions(journal_id)`);
    console.log("✅ Transactions table linked to Ledger");

    // ── NEW: Smart FX Rate Locking ────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fx_quotes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        amount NUMERIC(20, 8) NOT NULL,
        locked_rate NUMERIC(20, 8) NOT NULL,
        converted_amount NUMERIC(20, 8) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_fx_quotes_user_id ON fx_quotes(user_id)`);
    console.log("✅ FX Quotes table ready");

export const runMigrations = async () => {
  console.log("Migrations skipped in this environment");
};