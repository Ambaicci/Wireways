import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link2, Share2, Wallet } from "lucide-react";
import CollectActions from "@/components/dashboard/CollectActions";
import CollectList from "@/components/dashboard/CollectList";
import { recallMemory } from "@/wic/memory";

export const dynamic = "force-dynamic";

export default async function PaymentLinksPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  const result = await db.execute(
    "SELECT id, amount, currency, status, description, created_at FROM payment_links WHERE user_id = ? ORDER BY id DESC",
    [userId]
  );
  const links = result.rows.map((row) => ({
    id: row.id as number,
    amount: row.amount as number,
    currency: row.currency as string,
    status: row.status as string,
    description: row.description as string,
    created_at: row.created_at as string,
  }));

  const activeCount = links.filter((l) => l.status === "Active").length;
  const settledCount = links.length - activeCount;

  // Quiet WIC memory line
  let memoryLine: string | null = null;
  try {
    const txResult = await db.execute(
      "SELECT name, type, created_at FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100",
      [userId]
    );
    const transactions = txResult.rows.map((r) => ({
      name: r.name as string,
      type: r.type as string,
      createdAt: r.created_at as string,
    }));
    const memory = recallMemory({ transactions } as any);
    memoryLine = memory.patterns.find((p) => p.kind === "counterparty" && p.type === "in")?.statement ?? null;
  } catch {}

  return (
    <div className="max-w-[880px] mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Collect</h1>
          <p className="text-[13px] text-[#8D8476] mt-1">Invoicing without paperwork — create, share, get paid.</p>
        </div>
        <CollectActions />
      </div>

      {/* Quiet WIC memory line */}
      {memoryLine && (
        <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E8E0D4] rounded-[12px] px-4 py-3">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B98A2E] opacity-40" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[#B98A2E]" />
          </span>
          <span className="text-[12.5px] text-[#6E665A]">
            <span className="font-bold text-[#312B1E]">WIC</span> · {memoryLine}
          </span>
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(185,138,46,0.14)] flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4" style={{ color: "#B98A2E" }} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#312B1E]">1 · Create</div>
            <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">Set the amount and purpose. Wireways generates a secure checkout link.</p>
          </div>
        </div>
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(124,141,181,0.14)] flex items-center justify-center flex-shrink-0">
            <Share2 className="w-4 h-4 text-[#7C8DB5]" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#312B1E]">2 · Share</div>
            <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">Send it via WhatsApp, email, or copy it — anywhere your client is.</p>
          </div>
        </div>
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#E8F3EC] flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-[#287A55]" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#312B1E]">3 · Get paid</div>
            <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">Funds land in your wallet instantly. The link flips to Paid.</p>
          </div>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="relative bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] py-16 text-center overflow-hidden shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#B98A2E]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative w-14 h-14 mx-auto rounded-[14px] bg-[rgba(185,138,46,0.14)] flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6" style={{ color: "#B98A2E" }} />
          </div>
          <h2 className="text-[17px] font-bold text-[#312B1E] tracking-[-0.02em]">No payment links yet</h2>
          <p className="text-[13px] text-[#8D8476] mt-1.5 max-w-[360px] mx-auto leading-relaxed">
            Create your first link and get paid by anyone, anywhere — in any currency.
          </p>
        </div>
      ) : (
        <>
          {/* Stat chips */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4">
              <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Total links</div>
              <div className="text-[22px] font-bold text-[#312B1E] mt-1 tabular-nums">{links.length}</div>
            </div>
            <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4">
              <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Active</div>
              <div className="text-[22px] font-bold text-[#287A55] mt-1 tabular-nums">{activeCount}</div>
            </div>
            <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4">
              <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Settled</div>
              <div className="text-[22px] font-bold text-[#6E5B3E] mt-1 tabular-nums">{settledCount}</div>
            </div>
          </div>

          {/* Clickable invoice rows */}
          <CollectList links={links} />
        </>
      )}
    </div>
  );
}