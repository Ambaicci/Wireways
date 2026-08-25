import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CardsList from "@/components/dashboard/CardsList";
import { observeWorld } from "@/wic/observe";
import { recallMemory } from "@/wic/memory";

export const dynamic = "force-dynamic";

async function ensureMethodRules() {
  const cols = ["single_use INTEGER DEFAULT 0", "purpose TEXT", "monthly_limit REAL", "currency TEXT"];
  for (const c of cols) {
    try { await db.execute(`ALTER TABLE payment_methods ADD COLUMN ${c}`); } catch {}
  }
}

export default async function PaymentMethodsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  await ensureMethodRules();

  const result = await db.execute(
    "SELECT id, type, name, details, single_use, purpose, monthly_limit, currency FROM payment_methods WHERE user_id = ?",
    [userId]
  );
  const methods = result.rows.map((row: any) => ({
    id: row.id as number,
    type: row.type as string,
    name: row.name as string,
    details: row.details as string,
    single_use: (row.single_use as number) || 0,
    purpose: (row.purpose as string) || null,
    monthly_limit: row.monthly_limit ? Number(row.monthly_limit) : null,
    currency: (row.currency as string) || null,
  }));

  const world = await observeWorld(userId);
  const memory = recallMemory(world);
  const memoryLine = memory.patterns.find((p) => p.kind === "liquidity")?.statement ?? null;
  const cp = memory.patterns.find((p) => p.kind === "counterparty");
  const suggestion = cp ? cp.id.replace(/^cp-/, "") : null;

  const strategy = [...world.obligations]
    .sort((a, b) => a.daysUntilRun - b.daysUntilRun)
    .slice(0, 2)
    .map((o) => {
      const wallet = world.wallets.find((w) => w.currency === o.currency);
      if (wallet && wallet.balance >= o.amount)
        return { id: o.id, name: o.name, currency: o.currency, amount: o.amount, days: o.daysUntilRun, tone: "good", note: `Fund from your ${o.currency} wallet — no FX needed.` };
      const largest = [...world.wallets].sort((a, b) => b.usdValue - a.usdValue)[0];
      const rate = world.fx.usdRates[o.currency];
      return { id: o.id, name: o.name, currency: o.currency, amount: o.amount, days: o.daysUntilRun, tone: "convert", note: `Convert from ${largest?.currency ?? "USD"} (live ${o.currency} ${rate ? rate.toFixed(4) : "—"}).` };
    });

  return (
    <div className="max-w-[860px] mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Cards</h1>
        <p className="text-[13px] text-[#8D8476] mt-1">Smart doors for your money — each with its own rules.</p>
      </div>

      {memoryLine && (
        <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E8E0D4] rounded-[12px] px-4 py-3">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C94A1D] opacity-40" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[#C94A1D]" />
          </span>
          <span className="text-[12.5px] text-[#6E665A]"><span className="font-bold text-[#312B1E]">WIC</span> · {memoryLine}</span>
        </div>
      )}

      <CardsList methods={methods} strategy={strategy} suggestion={suggestion} />
    </div>
  );
}