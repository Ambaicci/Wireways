import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { observeWorld } from "@/wic/observe";
import { buildBriefing } from "@/wic/intelligence";
import WicDashboard from "@/components/dashboard/WicDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // GHOST BUSTER: Must be outside the try/catch so NEXT_REDIRECT isn't swallowed
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  try {
    // Personal greeting — resolve the user's real name
    let firstName: string | undefined;
    try {
      const userRes = await db.execute("SELECT * FROM users WHERE id = ?", [userId]);
      const row = userRes.rows[0] as any;
      const raw =
        row?.name || row?.full_name || row?.username ||
        (row?.email ? String(row.email).split("@")[0] : undefined);
      if (raw) firstName = String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
    } catch {}

    const world = await observeWorld(userId);
    const briefing = buildBriefing(world, firstName);
    const recent = world.transactions.slice(0, 5);

    return <WicDashboard briefing={briefing} recent={recent} wallets={world.wallets} />;
  } catch (error: any) {
    console.error("=== DASHBOARD CRASH ===", error);
    return (
      <div style={{ padding: 40, fontFamily: "monospace", color: "#B91C1C", background: "#FFFDF9", minHeight: "100vh" }}> 
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Dashboard Server Error</h1>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.5 }}>
          {error?.message}{"\n\n"}{error?.stack}
        </pre>
      </div>
    );
  }
}