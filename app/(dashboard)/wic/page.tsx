import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { observeWorld } from "@/wic/observe";
import { buildBriefing } from "@/wic/intelligence";
import { db } from "@/lib/db";
import WicIntelligenceClient from "@/components/dashboard/WicIntelligenceClient";

export default async function WICPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  try {
    const userRes = await db.execute("SELECT name FROM users WHERE id = $1", [session.userId]);
    const firstName = userRes.rows[0]?.name ? String(userRes.rows[0].name).split(" ")[0] : undefined;
    
    const world = await observeWorld(session.userId);
    const briefing = buildBriefing(world, firstName);

    return <WicIntelligenceClient briefing={briefing} />;
    
  } catch (error) {
    console.error("Failed to load WIC Intelligence:", error);
    return (
      <div className="min-h-screen bg-[#F6F5F3] flex items-center justify-center p-6">
        <div className="text-center bg-white border border-[#D1D1D6] rounded-[24px] p-8 max-w-md shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h2 className="text-[17px] font-bold text-[#1D1D1F] mb-2 tracking-tight">Unable to load WIC Intelligence</h2>
          <p className="text-[13px] text-[#86868B] leading-relaxed">We encountered an error. Please try refreshing.</p>
        </div>
      </div>
    );
  }
}