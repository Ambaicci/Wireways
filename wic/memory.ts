// ============================================================
// WIC Memory — Layer 2 "experience"
// Location: wic/memory.ts
// ============================================================
// Derives behavioral patterns from the user's real history.
// Deterministic, explainable, always fresh — WIC never guesses.
// ============================================================

import { WorldModel } from "./observe";

export interface MemoryPattern {
  id: string;
  kind: "counterparty" | "corridor" | "cadence" | "liquidity";
  statement: string;
  detail: string;
  confidence: number; // 0..1
  evidence: string[];
}

export interface MemoryProfile {
  learnedAt: string;
  patterns: MemoryPattern[];
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const SKIP_NAME = /top-?up|^close/i;

export function recallMemory(world: WorldModel): MemoryProfile {
  const patterns: MemoryPattern[] = [];

  // ── 1 · Counterparty cadence ──────────────────────────────
  const byName = new Map<string, { days: number[]; count: number; type: "in" | "out" }>();
  for (const t of world.transactions) {
    if (t.rail === "Internal FX" || SKIP_NAME.test(t.name)) continue;
    if (!byName.has(t.name)) byName.set(t.name, { days: [], count: 0, type: t.type });
    const g = byName.get(t.name)!;
    g.days.push(new Date(t.createdAt).getDate());
    g.count++;
    g.type = t.type;
  }
  for (const [name, g] of byName) {
    if (g.count < 3) continue;
    const avgDay = Math.round(g.days.reduce((a, b) => a + b, 0) / g.days.length);
    const verb = g.type === "out" ? "pay" : "receive from";
    patterns.push({
      id: `cp-${name}`,
      kind: "counterparty",
      statement: `You usually ${verb} ${name} around the ${ordinal(avgDay)}.`,
      detail: `${g.count} transactions observed in the last 30 days.`,
      confidence: Math.min(1, g.count / 6),
      evidence: [
        `${g.count} transactions with "${name}" in the last 30 days.`,
        `Average day-of-month: the ${ordinal(avgDay)}.`,
      ],
    });
  }

  // ── 2 · FX corridor habit ─────────────────────────────────
  const corridors = new Map<string, { count: number; totalOut: number; days: number[] }>();
  for (const t of world.transactions) {
    if (t.rail !== "Internal FX" || t.type !== "out") continue;
    const m = t.name.match(/Conversion USD → (\w+)/);
    if (!m) continue;
    if (!corridors.has(m[1])) corridors.set(m[1], { count: 0, totalOut: 0, days: [] });
    const g = corridors.get(m[1])!;
    g.count++;
    g.totalOut += t.amount;
    g.days.push(new Date(t.createdAt).getDate());
  }
  for (const [cur, g] of corridors) {
    if (g.count < 2) continue;
    const avgDay = Math.round(g.days.reduce((a, b) => a + b, 0) / g.days.length);
    patterns.push({
      id: `corridor-${cur}`,
      kind: "corridor",
      statement: `You convert USD → ${cur} regularly — ${g.count}× this month, usually around the ${ordinal(avgDay)}.`,
      detail: `≈ $${Math.round(g.totalOut).toLocaleString()} moved in total.`,
      confidence: Math.min(1, g.count / 8),
      evidence: [
        `${g.count} USD → ${cur} conversions in the last 30 days.`,
        `Total moved: $${Math.round(g.totalOut).toLocaleString()}.`,
      ],
    });
  }

  // ── 3 · Obligation rhythm (from wire-rolls) ───────────────
  for (const o of world.obligations) {
    const day = new Date(o.nextRunDate).getDate();
    patterns.push({
      id: `roll-${o.id}`,
      kind: "cadence",
      statement: `${o.name} runs ${o.frequency}, around the ${ordinal(day)}.`,
      detail: `${o.recipient} · ${o.rail}`,
      confidence: 0.9,
      evidence: [`Scheduled ${o.frequency}; next run on the ${ordinal(day)}.`],
    });
  }

  // ── 4 · Liquidity preference ──────────────────────────────
  const top = [...world.wallets].sort((a, b) => b.usdValue - a.usdValue)[0];
  if (top && world.totalUsd > 0) {
    const share = Math.round((top.usdValue / world.totalUsd) * 100);
    patterns.push({
      id: "liquidity",
      kind: "liquidity",
      statement: `You keep most liquidity in ${top.currency} (${share}%).`,
      detail: "Observed from your current wallet mix.",
      confidence: 0.6,
      evidence: [`Current ${top.currency} share: ${share}% of total balance.`],
    });
  }

  patterns.sort((a, b) => b.confidence - a.confidence);
  return { learnedAt: new Date().toISOString(), patterns: patterns.slice(0, 6) };
}