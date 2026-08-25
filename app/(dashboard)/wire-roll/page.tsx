import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import WireRollView from "@/components/dashboard/WireRollView";
import { runDueRolls } from "@/lib/actions";

export const dynamic = 'force-dynamic';

export default async function WireRollPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  // Scheduler: fire any due auto-run rolls
  await runDueRolls();

  const rollsRes = await db.execute("SELECT * FROM wire_rolls WHERE user_id = ? ORDER BY next_run_date ASC", [userId]);
  const rolls = rollsRes.rows.map((r: any) => ({
    id: r.id as number, name: r.name as string, recipient: r.recipient as string,
    currency: r.currency as string, amount: r.amount as number, frequency: r.frequency as string,
    next_run_date: r.next_run_date as string, rail: r.rail as string, status: r.status as string,
    auto_run: (r.auto_run as number) || 0,
  }));

  const rollIds = rolls.map((r) => r.id);
  let items: any[] = [];
  if (rollIds.length > 0) {
    const itemsRes = await db.execute(
      `SELECT * FROM wire_roll_items WHERE roll_id IN (${rollIds.map(() => "?").join(",")})`,
      rollIds
    );
    items = itemsRes.rows.map((i: any) => ({
      id: i.id as number, roll_id: i.roll_id as number, recipient: i.recipient as string,
      currency: i.currency as string, amount: i.amount as number, rail: i.rail as string,
    }));
  }

  const runsRes = await db.execute("SELECT * FROM wire_roll_runs WHERE user_id = ? ORDER BY id DESC LIMIT 8", [userId]);
  const runs = runsRes.rows.map((r: any) => ({
    id: r.id as number, roll_id: r.roll_id as number, amount: r.amount as number,
    status: r.status as string, executed_at: r.executed_at as string,
  }));

  const walletsRes = await db.execute("SELECT currency, balance FROM wallets WHERE user_id = ? AND is_active = 1", [userId]);
  const wallets = walletsRes.rows.map((w: any) => ({
    currency: w.currency as string, balance: w.balance as number,
  }));

  return <WireRollView rolls={rolls} runs={runs} wallets={wallets} items={items} />;
}