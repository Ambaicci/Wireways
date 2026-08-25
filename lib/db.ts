import postgres from "postgres";

const url = process.env.DATABASE_URL || "";

if (!url) {
  console.error("❌ DATABASE_URL is missing in .env.local");
}

// Initialize the postgres.js client
const sql = postgres(url, {
  max: 10,             // Restored for production speed
  idle_timeout: 20,
  connect_timeout: 30, // Generous timeout for Supabase cold starts
  prepare: false,      // Crucial for Supabase Transaction Pooler
});

// Helper to translate SQLite '?' to Postgres '$1, $2...'
function toNumbered(query: string): string {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
}

// Helper to translate SQLite DDL/functions to Postgres
function pgCompat(query: string): string {
  return query
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY")
    .replace(/\bAUTOINCREMENT\b/gi, "")
    .replace(/datetime\('now'\)/gi, "now()")
    .replace(/datetime\('now',\s*'([^']+)'\)/gi, "now() + interval '$1'")
    .replace(/REAL/gi, "DOUBLE PRECISION")
    .replace(/CURRENT_TIMESTAMP/gi, "CURRENT_TIMESTAMP::text");
}

export const db = {
  async execute(query: string, args: any[] = []) {
    const text = toNumbered(pgCompat(query));

    let rows: any[];
    
    // If it's an INSERT/UPDATE/DELETE and doesn't already have RETURNING, add it
    // so we can grab the `lastInsertRowid` just like SQLite did.
    if (/^\s*(INSERT|UPDATE|DELETE)\b/i.test(query) && !/\bRETURNING\b/i.test(query)) {
      try {
        rows = await sql.unsafe(`${text} RETURNING id`, args);
      } catch {
        // Fallback if the table doesn't have an 'id' column
        rows = await sql.unsafe(text, args);
      }
    } else {
      rows = await sql.unsafe(text, args);
    }

    return {
      rows: (rows || []) as any[],
      lastInsertRowid: (rows && rows[0] && rows[0].id) || 0,
    };
  },
};