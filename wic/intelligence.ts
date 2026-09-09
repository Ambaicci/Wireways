// ============================================================
// WIC Intelligence — Layer 2 "brain"
// Location: wic/intelligence.ts
// ============================================================
// Turns the WorldModel + Memory into a Briefing. Every figure
// is computed from real data. Intelligent + explainable +
// controllable. Never magical.
// ============================================================

import { WorldModel, TransactionSnapshot } from "./observe";
import { recallMemory, MemoryPattern } from "./memory";
import { 
  CURRENCY_SYMBOLS, 
  formatCurrency, 
  formatCompactUsd 
} from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────
export type MissionStatus = "attention" | "opportunity" | "good";

export interface Mission {
  id: string;
  status: MissionStatus;
  title: string;
  detail: string;
  actionLabel: string;
  action: { type: "prefill" | "none"; payload: string };
  explain: string[];
}

export interface WatchItem {
  id: string;
  category: "payment" | "fx" | "movement";
  title: string;
  detail: string;
  actionLabel?: string;
  action?: { type: "prefill" | "none"; payload: string };
  target?: string;
  rate?: number;
  avgRate?: number;
  deltaText?: string;
  convertPayload?: string;
}

export interface UpcomingItem {
  id: number;
  name: string;
  dateLabel: string;
  daysUntilRun: number;
  currency: string;
  amountLabel: string;
  funded: boolean;
  gapLabel: string | null;
}

export interface Briefing {
  greeting: string;
  headline: string;
  positionSummary: string;
  confidence: { ready: boolean; observedCount: number; threshold: number; score: number; label: string; note: string; factors: string[] };
  missions: Mission[];
  money: {
    totalUsd: number;
    liquidityDays: number;
    liquiditySentence: string;
    breakdown: { currency: string; balance: number; usdValue: number; sharePct: number }[];
    breakdownSentence: string;
  };
  watching: WatchItem[];
  upcoming: UpcomingItem[];
  memory: { line: string; patterns: MemoryPattern[] };
}

// ─── Formatting helpers ─────────────────────────────────────
// Now uses deterministic, locale-safe formatters from constants.ts

function dateLabel(dateStr: string): string {
  // CRITICAL: Intl.DateTimeFormat guarantees consistent formatting 
  // regardless of the server's host region.
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr)).toUpperCase().replace(",", " ·");
}

function toUsd(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1;
  return rate > 0 ? amount / rate : 0;
}

function pctDelta(current: number, baseline: number): string {
  if (baseline <= 0) return "near";
  const pct = ((current - baseline) / baseline) * 100;
  const dir = pct >= 0 ? "above" : "below";
  return `${Math.abs(pct).toFixed(1)}% ${dir}`;
}

function balanceOf(world: WorldModel, currency: string): number {
  return world.wallets.find((w) => w.currency === currency)?.balance ?? 0;
}

// ─── Conversion history analysis ────────────────────────────
function computeConversionStats(transactions: TransactionSnapshot[]) {
  const groups = new Map<string, { outs: TransactionSnapshot[]; ins: TransactionSnapshot[] }>();
  for (const t of transactions) {
    if (t.rail !== "Internal FX") continue;
    const m = t.name.match(/Conversion USD → (\w+)/);
    if (!m) continue;
    const target = m[1];
    if (!groups.has(target)) groups.set(target, { outs: [], ins: [] });
    const g = groups.get(target)!;
    (t.type === "out" ? g.outs : g.ins).push(t);
  }

  const stats: Record<string, { avgRate: number; count: number; totalOutUsd: number }> = {};
  for (const [target, g] of groups) {
    const outs = [...g.outs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const ins = [...g.ins].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const n = Math.min(outs.length, ins.length);
    let sum = 0, count = 0, totalOut = 0;
    for (let i = 0; i < n; i++) {
      const rate = ins[i].amount / outs[i].amount;
      if (isFinite(rate) && rate > 0) { sum += rate; count++; totalOut += outs[i].amount; }
    }
    if (count > 0) stats[target] = { avgRate: sum / count, count, totalOutUsd: totalOut };
  }
  return stats;
}

// ─── Confidence score ───────────────────────────────────────
// Calibration Gate: WIC earns the right to judge. No rating is
// shown until at least CALIBRATION_THRESHOLD real movements
// have been observed. Facts are free; judgment is earned.
const CALIBRATION_THRESHOLD = 3;

function computeConfidence(world: WorldModel) {
  const observedCount = world.transactions.length;
  const ready = observedCount >= CALIBRATION_THRESHOLD;
  const isEmptyWorld = world.totalUsd <= 0 && world.wallets.every((w) => w.balance === 0);

  // Stage 1 — Calibrating: no score, no label, no judgment.
  if (!ready) {
    return {
      ready: false,
      observedCount,
      threshold: CALIBRATION_THRESHOLD,
      score: 0,
      label: "Calibrating",
      note: `WIC is learning your rhythm. Your confidence rating unlocks after your 3rd transaction.`,
      factors: [
        `${observedCount} of ${CALIBRATION_THRESHOLD} movements observed so far.`,
        "Balances and schedules are always shown — the rating is earned, never guessed.",
      ],
    };
  }

  // Stage 2 — Established: honest scoring from real behavior.
  let score = 100;
  const factors: string[] = [];
  const unfunded = world.obligations.filter((o) => !o.fullyFunded);

  if (isEmptyWorld) {
    score -= 45;
    factors.push(`Your wallets are currently empty — fund them to activate your runway.`);
  } else if (world.liquidityDays >= 14) {
    factors.push(`${world.liquidityDays} days of operating liquidity — a healthy runway.`);
  } else if (world.liquidityDays >= 7) {
    score -= 5;
    factors.push(`Liquidity runway is ${world.liquidityDays} days — adequate but tightening.`);
  } else {
    score -= 15;
    factors.push(`Liquidity runway is only ${world.liquidityDays} days.`);
  }

  if (unfunded.length === 0 && world.obligations.length > 0) {
    factors.push(`All ${world.obligations.length} upcoming obligations are fully funded.`);
  }

  for (const o of unfunded) {
    const shortfallUsd = o.gaps.reduce((s, g) => s + toUsd(g.shortfall, g.currency, world.fx.usdRates), 0);
    const penalty = Math.min(25, 10 + Math.round((shortfallUsd / Math.max(world.totalUsd, 1)) * 100));
    score -= penalty;
    factors.push(`"${o.name}" has a funding gap (−${penalty} points).`);
  }

  const urgent = unfunded.filter((o) => o.daysUntilRun <= 3);
  if (urgent.length > 0) {
    score -= 10;
    factors.push(`${urgent.length} unfunded obligation(s) due within 3 days.`);
  }

  score = Math.max(40, Math.min(100, Math.round(score)));
  const label = score >= 85 ? "Strong position" : score >= 70 ? "Stable" : score >= 55 ? "Needs attention" : "At risk";
  const note = isEmptyWorld
    ? "Your wallets are empty — top up to activate your financial position."
    : unfunded.length === 0
      ? "Your liquidity is healthy and near-term obligations are covered."
      : `${unfunded.length} funding gap(s) need your attention.`;

  return { ready: true, observedCount, threshold: CALIBRATION_THRESHOLD, score, label, note, factors };
}

// ─── Missions ───────────────────────────────────────────────
function buildMissions(world: WorldModel, convStats: ReturnType<typeof computeConversionStats>): Mission[] {
  const missions: Mission[] = [];
  const largestWallet = [...world.wallets].sort((a, b) => b.usdValue - a.usdValue)[0];

  for (const o of world.obligations.filter((o) => !o.fullyFunded)) {
    const gap = o.gaps[0];
    missions.push({
      id: `fund-${o.id}`,
      status: "attention",
      title: `${o.name} is ${formatCurrency(gap.shortfall, gap.currency)} short.`,
      detail: `Due in ${o.daysUntilRun} day${o.daysUntilRun === 1 ? "" : "s"}. I can move funds from your ${largestWallet?.currency ?? "USD"} wallet to cover the gap before it runs.`,
      actionLabel: "Fix it",
      action: { type: "prefill", payload: `Convert ${Math.ceil(gap.shortfall)} ${largestWallet?.currency ?? "USD"} to ${gap.currency} to fund ${o.name}` },
      explain: [
        `Required: ${formatCurrency(gap.required, gap.currency)} · Available: ${formatCurrency(gap.available, gap.currency)}.`,
        `Shortfall: ${formatCurrency(gap.shortfall, gap.currency)} (≈ ${formatCompactUsd(toUsd(gap.shortfall, gap.currency, world.fx.usdRates))}).`,
        `Your largest wallet is ${largestWallet?.currency} (${formatCompactUsd(largestWallet?.usdValue ?? 0)}), which WIC can draw from.`,
      ],
    });
  }

  const fxObligation = world.obligations
    .filter((o) => o.currency !== "USD" && o.currency !== "USDC" && o.daysUntilRun <= 14)
    .sort((a, b) => a.daysUntilRun - b.daysUntilRun)[0];

  if (fxObligation) {
    const cur = fxObligation.currency;
    const bal = balanceOf(world, cur);
    const stat = convStats[cur];
    const liveRate = world.fx.usdRates[cur] ?? 0;

    if (bal >= fxObligation.amount) {
      missions.push({
        id: `fx-covered-${fxObligation.id}`,
        status: stat && liveRate < stat.avgRate ? "opportunity" : "good",
        title: `Your ${formatCurrency(fxObligation.amount, cur)} ${fxObligation.name} is already covered.`,
        detail: stat
          ? `Your ${cur} balance covers it — no conversion needed. Today's rate (${liveRate.toFixed(4)}) is ${pctDelta(liveRate, stat.avgRate)} your recent average, so there's no rush to convert.`
          : `Your ${cur} balance covers it — no conversion needed.`,
        actionLabel: "Review",
        action: { type: "none", payload: "" },
        explain: [
          `Upcoming need: ${formatCurrency(fxObligation.amount, cur)} in ${fxObligation.daysUntilRun} day(s).`,
          `Current ${cur} balance: ${formatCurrency(bal, cur)}.`,
          ...(stat ? [`Your average ${cur} conversion rate this month: ${stat.avgRate.toFixed(4)} across ${stat.count} conversions.`] : []),
          ...(stat ? [`Live rate today: ${liveRate.toFixed(4)} (${pctDelta(liveRate, stat.avgRate)} your average).`] : []),
        ],
      });
    } else if (stat && liveRate > stat.avgRate * 1.003) {
      missions.push({
        id: `fx-favorable-${fxObligation.id}`,
        status: "opportunity",
        title: `Today's ${cur} rate looks favorable.`,
        detail: `You need ${formatCurrency(fxObligation.amount - bal, cur)} more for ${fxObligation.name}. The current rate is ${pctDelta(liveRate, stat.avgRate)} your recent average — converting now could save you money.`,
        actionLabel: "Convert with WIC",
        action: { type: "prefill", payload: `Convert ${Math.ceil(fxObligation.amount - bal)} USD to ${cur}` },
        explain: [
          `Needed: ${formatCurrency(fxObligation.amount, cur)} · You have: ${formatCurrency(bal, cur)}.`,
          `Live rate: ${liveRate.toFixed(4)} vs your average ${stat.avgRate.toFixed(4)}.`,
        ],
      });
    }
  }

  const fundedCount = world.obligations.filter((o) => o.fullyFunded).length;
  if (fundedCount > 0) {
    missions.push({
      id: "funded-summary",
      status: "good",
      title: `${fundedCount} scheduled payment${fundedCount === 1 ? " is" : "s are"} fully funded.`,
      detail: "Nothing is at risk in the near term. Your operating liquidity is healthy.",
      actionLabel: "See schedule",
      action: { type: "none", payload: "" },
      explain: [
        `All ${fundedCount} active wire-roll(s) have enough balance to run on time.`,
        `Liquidity runway: ${world.liquidityDays} days.`,
      ],
    });
  }

  const order: Record<MissionStatus, number> = { attention: 0, opportunity: 1, good: 2 };
  return missions.sort((a, b) => order[a.status] - order[b.status]).slice(0, 3);
}

// ─── WIC Insights — exactly two purposeful cards ────────────
function buildWatching(
  world: WorldModel,
  convStats: ReturnType<typeof computeConversionStats>,
  memory: ReturnType<typeof recallMemory>
): WatchItem[] {
  const items: WatchItem[] = [];

  // ① FX insight — always actionable
  const corridors = Object.entries(convStats).sort((a, b) => b[1].totalOutUsd - a[1].totalOutUsd);
  if (corridors.length > 0) {
    const [target, stat] = corridors[0];
    const live = world.fx.usdRates[target] ?? 0;
    items.push({
      id: "watch-fx",
      category: "fx",
      title: `${target} rate is ${live.toFixed(4)}`,
      detail: `That's ${pctDelta(live, stat.avgRate)} your recent average of ${stat.avgRate.toFixed(4)} across ${stat.count} conversions this month.`,
      actionLabel: "Convert with WIC",
      action: { type: "prefill", payload: `Convert USD to ${target}` },
      target,
      rate: live,
      avgRate: stat.avgRate,
      deltaText: pctDelta(live, stat.avgRate),
      convertPayload: `Convert USD to ${target}`,
    });
  } else {
    items.push({
      id: "watch-fx",
      category: "fx",
      title: `EUR rate is ${(world.fx.usdRates.EUR ?? 0.92).toFixed(4)}`,
      detail: world.fx.live ? "Live mid-market rate, updated continuously." : "Using reference rates (live feed unavailable).",
    });
  }

  // ② Anticipation — one memory-driven, act-upon insight
  const cp = memory.patterns.find((p) => p.kind === "counterparty");
  const corridor = memory.patterns.find((p) => p.kind === "corridor");
  if (cp) {
    const name = cp.id.replace(/^cp-/, "");
    items.push({
      id: "watch-anticipate",
      category: "movement",
      title: cp.statement,
      detail: `${cp.detail} WIC can draft the next one in one tap.`,
      actionLabel: "Draft it",
      action: { type: "prefill", payload: `Send money to ${name}` },
    });
  } else if (corridor) {
    const target = corridor.id.replace(/^corridor-/, "");
    items.push({
      id: "watch-anticipate",
      category: "movement",
      title: corridor.statement,
      detail: corridor.detail,
      actionLabel: "Review rate",
      action: { type: "prefill", payload: `Convert USD to ${target}` },
    });
  } else {
    items.push({
      id: "watch-anticipate",
      category: "movement",
      title: "WIC is learning your rhythm.",
      detail: "As your history grows, WIC will anticipate payments and time conversions for you.",
    });
  }

  return items.slice(0, 2);
}

// ─── Upcoming schedule ──────────────────────────────────────
function buildUpcoming(world: WorldModel): UpcomingItem[] {
  return [...world.obligations]
    .sort((a, b) => a.daysUntilRun - b.daysUntilRun)
    .slice(0, 4)
    .map((o) => ({
      id: o.id,
      name: o.name,
      dateLabel: dateLabel(o.nextRunDate),
      daysUntilRun: o.daysUntilRun,
      currency: o.currency,
      amountLabel: formatCurrency(o.amount, o.currency),
      funded: o.fullyFunded,
      gapLabel: o.gaps.length > 0 ? `${formatCurrency(o.gaps[0].shortfall, o.gaps[0].currency)} gap` : null,
    }));
}

// ─── Main briefing builder ──────────────────────────────────
export function buildBriefing(world: WorldModel, firstName?: string): Briefing {
  const convStats = computeConversionStats(world.transactions);
  const confidence = computeConfidence(world);
  const missions = buildMissions(world, convStats);
  const memory = recallMemory(world);

  const memoryLine =
    memory.patterns.find((p) => p.kind === "corridor")?.statement ||
    memory.patterns.find((p) => p.kind === "counterparty")?.statement ||
    "";

  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greeting = firstName ? `${part}, ${firstName}.` : `${part}.`;

  const isEmptyWorld = world.totalUsd <= 0 && world.wallets.every((w) => w.balance === 0);
  const attentionCount = missions.filter((m) => m.status === "attention").length;

  let baseSummary = "";
  if (isEmptyWorld) {
    baseSummary = "Your workspace is set up and ready to go. Let's fund your first wallet to begin moving money.";
  } else if (attentionCount > 0) {
    baseSummary = `You're in good shape overall — but there ${attentionCount === 1 ? "is one thing" : `are ${attentionCount} things`} to handle soon.`;
  } else {
    baseSummary = "You're in good shape. Everything upcoming is funded — nothing needs your attention right now.";
  }

  const positionSummary =
    memoryLine && !isEmptyWorld ? `${baseSummary} ${memoryLine}` : baseSummary;

  // Money — top 5 wallets (zeros included for a complete board)
  const sortedWallets = [...world.wallets].sort((a, b) => b.usdValue - a.usdValue).slice(0, 5);
  const breakdown = sortedWallets.map((w) => ({
    currency: w.currency,
    balance: w.balance,
    usdValue: w.usdValue,
    sharePct: world.totalUsd > 0 ? Math.round((w.usdValue / world.totalUsd) * 100) : 0,
  }));
  const breakdownSentence = sortedWallets
    .filter((w) => w.usdValue > 0)
    .slice(0, 3)
    .map((w) => `${formatCompactUsd(w.usdValue)} ${w.currency}`)
    .join(" · ");

  const liquiditySentence = isEmptyWorld
    ? "Your wallets are empty. Top up to begin your financial operations."
    : world.liquidityDays >= 14
      ? `You're comfortably funded for the next ${world.liquidityDays} days.`
      : world.liquidityDays >= 7
        ? `You're funded for the next ${world.liquidityDays} days.`
        : `Liquidity is tight — about ${world.liquidityDays} days of runway.`;

  return {
    greeting,
    headline: "Here's what matters today.",
    positionSummary,
    confidence,
    missions,
    money: {
      totalUsd: world.totalUsd,
      liquidityDays: world.liquidityDays,
      liquiditySentence,
      breakdown,
      breakdownSentence,
    },
    watching: buildWatching(world, convStats, memory),
    upcoming: buildUpcoming(world),
    memory: { line: memoryLine, patterns: memory.patterns },
  };
}