import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
import PayActions from "@/components/dashboard/PayActions";
import PaymentsList from "@/components/dashboard/PaymentsList";
import { recallMemory } from "@/wic/memory";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  const result = await db.execute(
    "SELECT id, name, type, created_at, amount, status, rail FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100",
    [userId]
  );
  const transactions = result.rows.map(row => ({
    id: row.id as number,
    name: row.name as string,
    type: row.type as string,
    created_at: row.created_at as string,
    amount: row.amount as number,
    status: row.status as string,
    rail: row.rail as string,
  }));

  const walletsRes = await db.execute(
    "SELECT currency, balance FROM wallets WHERE user_id = ? AND is_active = 1",
    [userId]
  );
  const wallets = walletsRes.rows.map(r => ({
    currency: r.currency as string,
    balance: Number(r.balance) || 0,
  }));

  // Quiet WIC memory line — computed from the very transactions below
  let memoryLine: string | null = null;
  try {
    const memory = recallMemory({ transactions } as any);
    memoryLine = memory.patterns.find(p => p.kind === "counterparty")?.statement ?? null;
  } catch {}

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Pay</h1>
          <p className="text-[13px] text-[#8D8476] mt-1">Every inflow and outflow across your rails.</p>
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
          icon={<History className="w-6 h-6 text-[#F1622C]" />}
          title="No payments yet"
          hint="Every inflow and outflow will appear here the moment you send, receive, or convert money."
        />
      ) : (
        <PaymentsList transactions={transactions} />
      )}
    </div>
  );
}