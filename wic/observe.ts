// ============================================================
// WIC Observer — Layer 2 "eyes"
// Location: wic/observe.ts
// ============================================================
// Reads the user's real financial world into a structured
// WorldModel that the WIC intelligence layer reasons over.
//
// Principles:
//   • Strictly multi-tenant — every query is scoped by userId.
//   • Deterministic — no randomness, no guessing.
//   • Presentation-free — produces facts, not copy.
//     intelligence.ts turns these facts into briefings & missions.
// ============================================================

import { db } from "@/lib/db";
import { getLiveUsdRates } from "@/lib/fx";

// ─── Types ───────────────────────────────────────────────────
export interface WalletSnapshot {
  currency: string;
  balance: number;
  usdValue: number;
}

export interface FundingGap {
  currency: string;
  required: number;
  available: number;
  shortfall: number;
}

export interface Obligation {
  id: number;
  name: string;
  recipient: string;
  currency: string;
  amount: number;
  frequency: string;
  nextRunDate: string;
  rail: string;
  isBatch: boolean;
  itemCount: number;
  daysUntilRun: number;
  fullyFunded: boolean;
  gaps: FundingGap[];
}

export interface TransactionSnapshot {
  id: number;
  name: string;
  type: "in" | "out";
  amount: number;
  status: string;
  rail: string;
  currency: string;
  createdAt: string;
}

export interface FxSnapshot {
  live: boolean;
  usdRates: Record<string, number>;
  eurPerUsd: number;
}

export interface WorldModel {
  userId: number;
  observedAt: string;
  wallets: WalletSnapshot[];
  totalUsd: number;
  obligations: Obligation[];
  transactions: TransactionSnapshot[];
  fx: FxSnapshot;
  avgDailyOutflowUsd: number;
  liquidityDays: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function toUsd(amount: number, currency: string, usdRates: Record<string, number>): number {
  const rate = usdRates[currency] ?? 1;
  return rate > 0 ? amount / rate : 0;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return 999; // Fallback for malformed dates
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

// ─── Main Observer ───────────────────────────────────────────
export async function observeWorld(userId: number): Promise<WorldModel> {
  // 1. Wallets
  const walletRes = await db.execute(
    "SELECT currency, balance FROM wallets WHERE user_id = $1 AND is_active = 1",
    [userId]
  );

  // 2. Live FX (units per 1 USD); degrade to static rates on failure
  let usdRates: Record<string, number>;
  let fxLive = true;
  try {
    usdRates = await getLiveUsdRates();
  } catch {
    usdRates = { USD: 1, EUR: 0.92, GBP: 0.79, KES: 130, USDC: 1 };
    fxLive = false;
  }

  const wallets: WalletSnapshot[] = walletRes.rows.map((r) => {
    const currency = r.currency as string;
    const balance = Number(r.balance) || 0;
    return { currency, balance, usdValue: toUsd(balance, currency, usdRates) };
  });
  const totalUsd = wallets.reduce((sum, w) => sum + w.usdValue, 0);

  // Balance lookup by currency (for funding-gap math)
  const balanceByCurrency = new Map<string, number>();
  for (const w of wallets) {
    balanceByCurrency.set(w.currency, (balanceByCurrency.get(w.currency) || 0) + w.balance);
  }

  // 3. Active wire-roll obligations
  const rollRes = await db.execute(
    `SELECT id, name, recipient, currency, amount, frequency, next_run_date, rail
     FROM wire_rolls WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  // Batch line items
  const itemsByRoll = new Map<number, { currency: string; amount: number }[]>();
  const rollIds = rollRes.rows.map((r) => Number(r.id));
  
  if (rollIds.length > 0) {
    try {
      // CRITICAL FIX: Use Postgres native ANY() operator instead of manual placeholder generation.
      // postgres.js safely handles JS arrays passed as parameters.
      const itemRes = await db.execute(
        `SELECT roll_id, currency, amount FROM wire_roll_items WHERE roll_id = ANY($1)`,
        [rollIds]
      );
      for (const row of itemRes.rows) {
        const rid = Number(row.roll_id);
        if (!itemsByRoll.has(rid)) itemsByRoll.set(rid, []);
        itemsByRoll.get(rid)!.push({ currency: row.currency as string, amount: Number(row.amount) || 0 });
      }
    } catch {
      /* wire_roll_items not present or empty — single-recipient rolls only */
    }
  }

  const obligations: Obligation[] = rollRes.rows.map((r) => {
    const id = Number(r.id);
    const rollCurrency = r.currency as string;
    const rollAmount = Number(r.amount) || 0;
    const items = itemsByRoll.get(id) || [];
    const isBatch = items.length > 0;

    // Required funds per currency for this cycle
    const requiredByCurrency = new Map<string, number>();
    if (isBatch) {
      for (const it of items) {
        requiredByCurrency.set(it.currency, (requiredByCurrency.get(it.currency) || 0) + it.amount);
      }
    } else {
      requiredByCurrency.set(rollCurrency, rollAmount);
    }

    // Funding gaps
    const gaps: FundingGap[] = [];
    for (const [currency, required] of requiredByCurrency) {
      const available = balanceByCurrency.get(currency) || 0;
      const shortfall = required - available;
      if (shortfall > 0) gaps.push({ currency, required, available, shortfall });
    }

    return {
      id,
      name: r.name as string,
      recipient: r.recipient as string,
      currency: rollCurrency,
      amount: rollAmount,
      frequency: r.frequency as string,
      nextRunDate: r.next_run_date as string,
      rail: r.rail as string,
      isBatch,
      itemCount: items.length,
      daysUntilRun: daysUntil(r.next_run_date as string),
      fullyFunded: gaps.length === 0,
      gaps,
    };
  });

  // 4. Recent movement (last 30 days, capped at 200 for token efficiency)
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const txRes = await db.execute(
    `SELECT id, name, type, amount, status, rail, currency, created_at
     FROM transactions 
     WHERE user_id = $1 AND created_at >= $2 
     ORDER BY created_at DESC, id DESC 
     LIMIT 200`,
    [userId, cutoff]
  );
  
  const transactions: TransactionSnapshot[] = txRes.rows.map((r) => ({
    id: Number(r.id),
    name: r.name as string,
    type: (r.type as string) === "in" ? "in" : "out",
    amount: Number(r.amount) || 0,
    status: r.status as string,
    rail: r.rail as string,
    currency: (r.currency as string) || "USD",
    createdAt: r.created_at as string,
  }));

  // 5. Average daily outflow (convert all outflows to USD)
  const totalOutflowUsd = transactions
    .filter((t) => t.type === "out")
    .reduce((sum, t) => sum + toUsd(t.amount, t.currency, usdRates), 0);
  const avgDailyOutflowUsd = totalOutflowUsd / 30;

  // 6. Liquidity runway (capped at 90 days for sanity, 0 if empty world)
  let liquidityDays: number;
  if (totalUsd <= 0) {
    liquidityDays = 0;
  } else if (avgDailyOutflowUsd <= 0) {
    liquidityDays = 90;
  } else {
    liquidityDays = Math.min(90, Math.floor(totalUsd / avgDailyOutflowUsd));
  }

  return {
    userId,
    observedAt: new Date().toISOString(),
    wallets,
    totalUsd,
    obligations,
    transactions,
    fx: { live: fxLive, usdRates, eurPerUsd: usdRates.EUR ?? 0.92 },
    avgDailyOutflowUsd,
    liquidityDays,
  };
}