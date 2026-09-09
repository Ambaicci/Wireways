import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { observeWorld } from "@/wic/observe";
import { recallMemory } from "@/wic/memory";
import PaymentLinksHeader from "@/components/dashboard/PaymentLinksHeader";
import PaymentLinksList from "@/components/dashboard/PaymentLinksList";

export const dynamic = "force-dynamic";

export default async function PaymentLinksPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  try {
    // 1. Fetch payment links
    const result = await db.execute(
      `SELECT id, amount, currency, status, description, created_at 
       FROM payment_links 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const links = result.rows.map((row: any) => ({
      id: Number(row.id),
      amount: Number(row.amount),
      currency: row.currency as string,
      status: row.status as string,
      description: row.description ? String(row.description) : "Payment Request",
      created_at: row.created_at as string,
    }));

    // 2. WIC memory line
    let memoryLine: string | null = null;
    try {
      const world = await observeWorld(userId);
      const memory = recallMemory(world);
      const linkPattern = memory.patterns.find((p: any) => p.kind === "payment_link");
      memoryLine = linkPattern?.statement ?? null;
    } catch (error) {
      console.warn("WIC memory fetch failed:", error);
    }

    return (
      <div className="max-w-[1000px] mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Payment Links</h1>
            <p className="text-[13px] text-[#8D8476] mt-1">Generate secure, shareable links to collect payments.</p>
          </div>
          <PaymentLinksHeader />
        </div>

        {/* Quiet WIC memory line */}
        {memoryLine && (
          <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E8E0D4] rounded-[12px] px-4 py-3">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4C5C88] opacity-40" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-[#4C5C88]" />
            </span>
            <span className="text-[12.5px] text-[#6E665A]">
              <span className="font-bold text-[#312B1E]">WIC</span> · {memoryLine}
            </span>
          </div>
        )}

        {/* Links list (or empty state) */}
        <PaymentLinksList initialLinks={links} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch payment links:", error);
    return (
      <div className="max-w-[1000px] mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg">Something went wrong</h2>
          <p className="text-red-600 mt-2">Unable to load your payment links. Please try again later.</p>
        </div>
      </div>
    );
  }
}