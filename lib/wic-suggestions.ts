// ─── WIC Pattern Detector ───────────────────────────────────
// Analyzes transaction history to detect recurring payment patterns
// and suggests wire-rolls the user hasn't created yet.
//
// Pure function — no DB access, no side effects. Easy to test.

interface Transaction {
  name: string;
  amount: number;
  currency: string;
  type: string;
  createdAt: string | Date;
}

interface ExistingRoll {
  recipient: string;
  items?: { recipient: string }[];
}

export interface WireRollSuggestion {
  id: string; // deterministic ID based on recipient+currency
  recipient: string;
  currency: string;
  averageAmount: number;
  suggestedFrequency: "weekly" | "biweekly" | "monthly";
  confidence: number; // 0-100
  transactionCount: number;
  lastPaymentDate: string;
  typicalDayOfMonth?: number; // for monthly patterns
  reason: string; // human-readable explanation
}

// ─── Main Detection Function ────────────────────────────────
export function detectRecurringPatterns(
  transactions: Transaction[],
  existingRolls: ExistingRoll[]
): WireRollSuggestion[] {
  // 1. Filter to outgoing transactions only, last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const outgoing = transactions
    .filter(t => t.type === "out" && new Date(t.createdAt) >= cutoff)
    .map(t => ({
      ...t,
      name: normalizeName(t.name),
      date: new Date(t.createdAt),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // 2. Group by normalized recipient name
  const groups = new Map<string, typeof outgoing>();
  for (const tx of outgoing) {
    const key = `${tx.name}||${tx.currency}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  // 3. Analyze each group for recurring patterns
  const suggestions: WireRollSuggestion[] = [];

  for (const [key, txs] of groups.entries()) {
    if (txs.length < 3) continue; // Need at least 3 data points

    const [recipient, currency] = key.split("||");

    // Skip if a wire-roll already exists for this recipient
    if (hasExistingRoll(recipient, existingRolls)) continue;

    // Analyze the pattern
    const analysis = analyzePattern(txs);
    if (!analysis.isRecurring) continue;

    // Build the suggestion
    const avgAmount = txs.reduce((sum, t) => sum + t.amount, 0) / txs.length;
    const lastDate = txs[txs.length - 1].date;

    suggestions.push({
      id: `sugg_${recipient}_${currency}`.replace(/\s+/g, "_").toLowerCase(),
      recipient,
      currency,
      averageAmount: Math.round(avgAmount * 100) / 100,
      suggestedFrequency: analysis.frequency,
      confidence: analysis.confidence,
      transactionCount: txs.length,
      lastPaymentDate: lastDate.toISOString(),
      typicalDayOfMonth: analysis.frequency === "monthly" ? analysis.typicalDay : undefined,
      reason: buildReason(recipient, analysis, txs.length),
    });
  }

  // 4. Sort by confidence (highest first), limit to top 5
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

// ─── Pattern Analysis ───────────────────────────────────────
interface PatternAnalysis {
  isRecurring: boolean;
  frequency: "weekly" | "biweekly" | "monthly";
  confidence: number;
  typicalDay?: number;
}

function analyzePattern(txs: { date: Date; amount: number }[]): PatternAnalysis {
  // Compute intervals between consecutive transactions
  const intervals: number[] = [];
  for (let i = 1; i < txs.length; i++) {
    const days = (txs[i].date.getTime() - txs[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  if (intervals.length === 0) {
    return { isRecurring: false, frequency: "monthly", confidence: 0 };
  }

  // Find the median interval
  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Classify the frequency
  let frequency: "weekly" | "biweekly" | "monthly";
  let intervalMatch = false;

  if (median >= 6 && median <= 8) {
    frequency = "weekly";
    intervalMatch = true;
  } else if (median >= 13 && median <= 16) {
    frequency = "biweekly";
    intervalMatch = true;
  } else if (median >= 28 && median <= 32) {
    frequency = "monthly";
    intervalMatch = true;
  } else {
    // No clear pattern
    return { isRecurring: false, frequency: "monthly", confidence: 0 };
  }

  // Compute consistency (standard deviation of intervals)
  const mean = intervals.reduce((s, i) => s + i, 0) / intervals.length;
  const variance = intervals.reduce((s, i) => s + Math.pow(i - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Consistency score: lower stdDev = higher consistency
  // For monthly: stdDev < 3 days is great, < 5 is good
  // For weekly: stdDev < 2 days is great
  const maxAcceptableStdDev = frequency === "monthly" ? 5 : frequency === "biweekly" ? 3 : 2;
  const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / maxAcceptableStdDev) * 50));

  // Amount consistency bonus (if amounts are similar, boost confidence)
  const amounts = txs.map(t => t.amount);
  const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const amountVariance = amounts.reduce((s, a) => s + Math.pow(a - avgAmount, 2), 0) / amounts.length;
  const amountCv = Math.sqrt(amountVariance) / avgAmount; // coefficient of variation
  const amountScore = Math.max(0, Math.min(100, 100 - amountCv * 200));

  // Final confidence: weighted average
  const confidence = Math.round(consistencyScore * 0.7 + amountScore * 0.3);

  // Only suggest if confidence is reasonable
  if (confidence < 50) {
    return { isRecurring: false, frequency, confidence };
  }

  // For monthly patterns, compute typical day of month
  let typicalDay: number | undefined;
  if (frequency === "monthly") {
    const days = txs.map(t => t.date.getDate());
    const sortedDays = [...days].sort((a, b) => a - b);
    typicalDay = sortedDays[Math.floor(sortedDays.length / 2)];
  }

  return {
    isRecurring: true,
    frequency,
    confidence,
    typicalDay,
  };
}

// ─── Helpers ────────────────────────────────────────────────
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function hasExistingRoll(recipient: string, rolls: ExistingRoll[]): boolean {
  const normalized = normalizeName(recipient);
  for (const roll of rolls) {
    if (normalizeName(roll.recipient) === normalized) return true;
    // Also check batch items
    if (roll.items) {
      for (const item of roll.items) {
        if (normalizeName(item.recipient) === normalized) return true;
      }
    }
  }
  return false;
}

function buildReason(recipient: string, analysis: PatternAnalysis, count: number): string {
  const freqLabel = analysis.frequency === "weekly" ? "weekly" : 
                    analysis.frequency === "biweekly" ? "every two weeks" : 
                    "monthly";
  
  let reason = `You've paid ${recipient} ${count} times in the last 90 days with a consistent ${freqLabel} pattern.`;
  
  if (analysis.frequency === "monthly" && analysis.typicalDay) {
    reason += ` Typically around the ${analysis.typicalDay}${getOrdinalSuffix(analysis.typicalDay)} of each month.`;
  }
  
  return reason;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}