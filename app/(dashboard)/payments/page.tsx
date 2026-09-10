import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { History, Search } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
import PayActions from "@/components/dashboard/PayActions";
import PaymentsList from "@/components/dashboard/PaymentsList";
import { recallMemory } from "@/wic/memory";
import { observeWorld } from "@/wic/observe";

export const dynamic = "force-dynamic";

interface SearchParams {
  type?: string;
  currency?: string;
  search?: string;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  // Resolve search params (Next.js 15+ pattern)
  const params = await searchParams;
  const filterType = params.type || "all";
  const filterCurrency = params.currency || "all";
  const searchQuery = params.search || "";

  // 1. Fetch wallets (for filter dropdowns and PayActions)
  const walletsRes = await db.execute(
    "SELECT currency, balance FROM wallets WHERE user_id = $1 AND is_active = 1",
    [userId]
  );
  const wallets = walletsRes.rows.map((r: any) => ({
    currency: r.currency as string,
    balance: Number(r.balance) || 0,
  }));

  // 2. Build dynamic transaction query with filters
  let query = `
    SELECT id, name, type, created_at, amount, status, rail, currency 
    FROM transactions 
    WHERE user_id = $1
  `;
  const queryParams: any[] = [userId];
  let paramIndex = 2;

  if (filterType && filterType !== "all") {
    query += ` AND type = $${paramIndex}`;
    queryParams.push(filterType);
    paramIndex++;
  }

  if (filterCurrency && filterCurrency !== "all") {
    query += ` AND currency = $${paramIndex}`;
    queryParams.push(filterCurrency);
    paramIndex++;
  }

  if (searchQuery) {
    query += ` AND name ILIKE $${paramIndex}`;
    queryParams.push(`%${searchQuery}%`);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await db.execute(query, queryParams);
  
  const transactions = result.rows.map((row: any) => ({
    id: row.id as number,
    name: row.name as string,
    type: row.type as string,
    created_at: row.created_at as string,
    amount: Number(row.amount),
    status: row.status as string,
    rail: (row.rail as string) || "Unknown",
    currency: row.currency as string,
  }));

  // 3. WIC memory line — computed from transactions
  let memoryLine: string | null = null;
  try {
    const world = await observeWorld(userId);
    const memory = recallMemory(world);
    memoryLine = memory.patterns.find((p: any) => p.kind === "counterparty")?.statement ?? null;
  } catch (error) {
    console.warn("WIC memory fetch failed:", error);
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Pay</h1>
          <p className="text-[13px] text-[#8D8476] mt-1">
            Every inflow and outflow across your rails.
          </p>
        </div>
        <PayActions wallets={wallets} />
      </div>

      {/* Quiet WIC memory line */}
      {memoryLine && (
        <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E8E0D4] rounded-[12px] px-4 py-3">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F1622C] opacity-40" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[#F1622C]" />
          </span>
          <span className="text-[12.5px] text-[#6E665A]">
            <span className="font-bold text-[#312B1E]">WIC</span> · {memoryLine}
          </span>
        </div>
      )}

      {/* Transactions list (or empty state) */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6 text-[#F1622C]" />}
          title={searchQuery || filterType !== "all" ? "No matching payments" : "No payments yet"}
          hint={
            searchQuery || filterType !== "all"
              ? "Try adjusting your filters or search query."
              : "Every inflow and outflow will appear here the moment you send, receive, or convert money."
          }
        />
      ) : (
         <PaymentsList
          transactions={transactions}
          currentFilters={{
            type: filterType,
            currency: filterCurrency,
            search: searchQuery,
          }}
        />
      )}
    </div>
  );
}