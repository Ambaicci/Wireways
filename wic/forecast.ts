// ============================================================
// WIC Forecast — projecting the future from real commitments
// Location: wic/forecast.ts
// ============================================================
// Explainable cash-flow projection: scheduled outflows (wire-rolls,
// repeated by frequency inside the horizon) + expected inflows
// (counterparties who pay you regularly, from history) simulated
// day-by-day against today's balances. No fake precision — only
// known and patterned flows, fully traceable in `events`.
// ============================================================

import { WorldModel } from "./observe";

const DAY = 86400000;

export interface ForecastEvent {
  dayOffset: number;
  date: string;
  label: string;
  kind: "in" | "out";
  usd: number;
  currency: string;
  amount: number;
}

export interface Forecast {
  horizonDays: number;
  events: ForecastEvent[];
  firstGap: (ForecastEvent & { shortfallUsd: number }) | null;
  fundedThrough: string;
  projectedEndUsd: number;
  sentence: string;
}

function toUsd(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1;
  return rate > 0 ? amount / rate : 0;
}

function compactUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${sign}$${Math.round(v / 1_000)}K`;
  return `${sign}$${Math.round(v)}`;
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildForecast(world: WorldModel, horizonDays = 30): Forecast {
  const rates = world.fx.usdRates;
  const now = new Date();
  const events: ForecastEvent[] = [];

  // ── Scheduled outflows (repeat weekly/biweekly inside horizon) ──
  for (const o of world.obligations) {
    if (o.daysUntilRun > horizonDays) continue;
    const usd = toUsd(o.amount, o.currency, rates);
    const push = (offset: number) => {
      const d = new Date(now.getTime() + offset * DAY);
      events.push({
        dayOffset: offset,
        date: d.toISOString(),
        label: o.name,
        kind: "out",
        usd,
        currency: o.currency,
        amount: o.amount,
      });
    };
    push(o.daysUntilRun);
    const step = o.frequency === "weekly" ? 7 : o.frequency === "biweekly" ? 14 : 0;
    if (step > 0) {
      for (let d = o.daysUntilRun + step; d <= horizonDays; d += step) push(d);
    }
  }

  // ── Expected inflows: counterparties who pay you regularly ──
  const inflows = new Map<string, { days: number[]; amounts: number[] }>();
  for (const t of world.transactions) {
    if (t.type !== "in" || t.rail === "Internal FX") continue;
    if (!inflows.has(t.name)) inflows.set(t.name, { days: [], amounts: [] });
    const g = inflows.get(t.name)!;
    g.days.push(new Date(t.createdAt).getDate());
    g.amounts.push(t.amount);
  }
  for (const [name, g] of inflows) {
    if (g.days.length < 2) continue;
    const avgDay = Math.round(g.days.reduce((a, b) => a + b, 0) / g.days.length);
    const avgAmount = g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length;
    const target = new Date(now.getFullYear(), now.getMonth(), avgDay, 12);
    if (target.getTime() <= now.getTime()) target.setMonth(target.getMonth() + 1);
    const offset = Math.ceil((target.getTime() - now.getTime()) / DAY);
    if (offset > horizonDays) continue;
    events.push({
      dayOffset: offset,
      date: target.toISOString(),
      label: `${name} (usual)`,
      kind: "in",
      usd: avgAmount,
      currency: "USD",
      amount: avgAmount,
    });
  }

  // ── Day-by-day simulation ──
  const sorted = [...events].sort((a, b) => a.dayOffset - b.dayOffset);
  let balance = world.totalUsd;
  let firstGap: (ForecastEvent & { shortfallUsd: number }) | null = null;
  let lastSafe = now;

  for (const e of sorted) {
    balance += e.kind === "in" ? e.usd : -e.usd;
    if (balance < 0 && !firstGap) {
      firstGap = { ...e, shortfallUsd: -balance };
    } else if (balance >= 0) {
      lastSafe = new Date(e.date);
    }
  }

  const horizonEnd = new Date(now.getTime() + horizonDays * DAY);
  const fundedThrough = firstGap ? dateLabel(lastSafe.toISOString()) : dateLabel(horizonEnd.toISOString());

  const sentence = firstGap
    ? `Looking ${horizonDays} days ahead: you stay funded through ${fundedThrough}, but "${firstGap.label}" on ${dateLabel(firstGap.date)} projects a ${compactUsd(firstGap.shortfallUsd)} shortfall. Fund it early or shift the date.`
    : `Looking ${horizonDays} days ahead: every scheduled payment is covered — you end near ${compactUsd(balance)} after ${sorted.length} projected movements.`;

  return { horizonDays, events: sorted, firstGap, fundedThrough, projectedEndUsd: balance, sentence };
}