import postgres from "postgres";
import { DatabaseError } from "@/lib/errors";

// ─── Environment Validation ──────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ FATAL: DATABASE_URL is not defined in environment");
  process.exit(1);
}

// ─── Connection Pool ──────────────────────────────────────────
const sql = postgres(DATABASE_URL, {
  max: 20,
  idle_timeout: 10,
  connect_timeout: 15,
  prepare: true,
  debug: process.env.NODE_ENV === "development"
    ? (connection: any, query: string, params: any[]) => {
        console.log("🔍 Query:", query);
        console.log("📦 Params:", params);
      }
    : false,
  onnotice: (notice: any) => {
    console.warn("📢 Postgres Notice:", notice.message);
  },
});

// ─── Type Helpers ─────────────────────────────────────────────
export type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
  lastInsertId?: number;
};

// ─── Main DB Client ───────────────────────────────────────────
export const db = {
  async query<T = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): Promise<QueryResult<T>> {
    try {
      const result: any = await sql`${sql(strings, ...values)}`;
      return {
        rows: result as T[],
        rowCount: result.length,
      };
    } catch (error) {
      console.error("❌ Database query failed:", error);
      throw new DatabaseError("Query execution failed", {
        cause: error,
        query: strings.join("?"),
      });
    }
  },

  async execute<T = any>(
    query: string,
    args: any[] = []
  ): Promise<QueryResult<T>> {
    try {
      const trimmedQuery = query.trim();
      
      if (!trimmedQuery) {
        return { rows: [], rowCount: 0 };
      }
      
      const result: any = await sql.unsafe(trimmedQuery, args);
      return {
        rows: result as T[],
        rowCount: result.length,
      };
    } catch (error) {
      console.error("❌ Database execute failed:", error);
      throw new DatabaseError("Query execution failed", {
        cause: error,
        query,
      });
    }
  },

  async transaction<T = any>(
    callback: (trx: any) => Promise<T>
  ): Promise<T> {
    try {
      return await (sql as any).begin(async (trx: any) => {
        return callback(trx);
      });
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      throw new DatabaseError("Transaction failed", { cause: error });
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },

  getClient() {
    return sql;
  },
};

export async function closeDatabaseConnection(): Promise<void> {
  await sql.end();
  console.log("✅ Database connection closed");
}

export default sql;