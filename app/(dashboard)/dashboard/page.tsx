import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { observeWorld } from "@/wic/observe";
import { buildBriefing } from "@/wic/intelligence";
import WicDashboard from "@/components/dashboard/WicDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  try {
    // 1. Get user profile
    const userRes = await db.execute(
      "SELECT name, email, account_type, company FROM users WHERE id = $1",
      [userId]
    );
    const user = userRes.rows[0] as any;

    const firstName = user?.name ? String(user.name).split(" ")[0] : undefined;
    const accountType = user?.account_type || "personal";
    const company = user?.company || undefined;

    // 2. Observe the real world
    const world = await observeWorld(userId);

    // 3. Build the deterministic briefing
    const briefing = buildBriefing(world, firstName);

    // 4. Get recent transactions (limit 5)
    const recent = world.transactions.slice(0, 5);

    return (
               <WicDashboard
        briefing={briefing}
        recent={recent}
        wallets={world.wallets}
        accountType={accountType}
        company={company}
      />
    );
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return (
      <div className="max-w-[1000px] mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg">Something went wrong</h2>
          <p className="text-red-600 mt-2">Unable to load your dashboard. Please try again later.</p>
          <p className="text-red-400 text-sm mt-4">{error?.message || "Unknown error"}</p>
        </div>
      </div>
    );
  }
}