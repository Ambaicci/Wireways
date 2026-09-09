import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized", rolls: [] }, { status: 401 });
    }

    // 1. Fetch wire-rolls
    const rollsRes = await db.execute(
      `SELECT id, name, recipient, currency, amount, frequency, next_run_date, rail, status, auto_run
       FROM wire_rolls 
       WHERE user_id = $1 
       ORDER BY next_run_date ASC`,
      [session.userId]
    );

    const rolls = rollsRes.rows as any[];
    const rollIds = rolls.map(r => r.id);

    // 2. Fetch batch items
    const itemsByRoll = new Map<number, any[]>();
    if (rollIds.length > 0) {
      try {
        const placeholders = rollIds.map((_, i) => `$${i + 1}`).join(",");
        const itemsRes = await db.execute(
          `SELECT roll_id, recipient, currency, amount, rail 
           FROM wire_roll_items 
           WHERE roll_id IN (${placeholders})
           ORDER BY id ASC`,
          rollIds
        );
        for (const row of itemsRes.rows) {
          const rid = Number(row.roll_id);
          if (!itemsByRoll.has(rid)) itemsByRoll.set(rid, []);
          itemsByRoll.get(rid)!.push(row);
        }
      } catch (err) {
        console.warn("Could not fetch batch items:", err);
      }
    }

    // 3. Fetch execution history (last 5 runs per roll)
    const historyByRoll = new Map<number, any[]>();
    if (rollIds.length > 0) {
      try {
        const placeholders = rollIds.map((_, i) => `$${i + 1}`).join(",");
        const historyRes = await db.execute(
          `SELECT roll_id, amount, status, rail, executed_at
           FROM wire_roll_runs 
           WHERE roll_id IN (${placeholders})
           ORDER BY executed_at DESC`,
          rollIds
        );
        for (const row of historyRes.rows) {
          const rid = Number(row.roll_id);
          if (!historyByRoll.has(rid)) historyByRoll.set(rid, []);
          if (historyByRoll.get(rid)!.length < 5) {
            historyByRoll.get(rid)!.push(row);
          }
        }
      } catch (err) {
        console.warn("Could not fetch execution history:", err);
      }
    }

    // 4. Fetch wallet balances for funding status
    const walletsRes = await db.execute(
      `SELECT currency, balance FROM wallets WHERE user_id = $1 AND is_active = 1`,
      [session.userId]
    );
    const balanceByCurrency = new Map<string, number>();
    for (const w of walletsRes.rows) {
      balanceByCurrency.set(w.currency as string, Number(w.balance));
    }

    // 5. Assemble enriched response
    const enrichedRolls = rolls.map(r => {
      const items = itemsByRoll.get(r.id) || [];
      const history = historyByRoll.get(r.id) || [];
      const isBatch = items.length > 0;

      let fundingStatus: "funded" | "partial" | "unfunded" = "funded";
      let shortfall = 0;
      let shortfallCurrency = r.currency;

      if (isBatch) {
        const neededByCurrency = new Map<string, number>();
        for (const it of items) {
          const cur = it.currency as string;
          neededByCurrency.set(cur, (neededByCurrency.get(cur) || 0) + Number(it.amount));
        }
        for (const [cur, needed] of neededByCurrency) {
          const available = balanceByCurrency.get(cur) || 0;
          if (needed > available) {
            fundingStatus = "unfunded";
            shortfall = needed - available;
            shortfallCurrency = cur;
            break;
          }
        }
      } else {
        const available = balanceByCurrency.get(r.currency) || 0;
        const needed = Number(r.amount);
        if (needed > available) {
          fundingStatus = "unfunded";
          shortfall = needed - available;
          shortfallCurrency = r.currency;
        }
      }

      return {
        ...r,
        items,
        isBatch,
        itemCount: items.length,
        history: history.map((h: any) => ({
          status: h.status,
          executedAt: h.executed_at,
          amount: Number(h.amount),
          rail: h.rail,
        })),
        lastRun: history.length > 0 ? {
          status: history[0].status,
          executedAt: history[0].executed_at,
          amount: Number(history[0].amount),
        } : null,
        fundingStatus,
        shortfall,
        shortfallCurrency,
      };
    });

    return NextResponse.json({ success: true, rolls: enrichedRolls });
  } catch (error: any) {
    console.error("❌ Wire-rolls API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch", rolls: [] },
      { status: 500 }
    );
  }
}