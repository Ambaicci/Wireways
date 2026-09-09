import { detectRecurringPatterns } from "./lib/wic-suggestions";

// Simulate 90 days of transaction history (within last 90 days from Sept 2, 2026)
const mockTransactions = [
  // John's monthly retainer (should detect monthly pattern)
  { name: "John Kamau", amount: 500, currency: "USD", type: "out", createdAt: "2026-06-15" },
  { name: "John Kamau", amount: 500, currency: "USD", type: "out", createdAt: "2026-07-15" },
  { name: "John Kamau", amount: 500, currency: "USD", type: "out", createdAt: "2026-08-15" },
  { name: "John Kamau", amount: 500, currency: "USD", type: "out", createdAt: "2026-09-01" },

  // Contractor (biweekly pattern)
  { name: "Acme Corp", amount: 1200, currency: "USD", type: "out", createdAt: "2026-07-01" },
  { name: "Acme Corp", amount: 1200, currency: "USD", type: "out", createdAt: "2026-07-15" },
  { name: "Acme Corp", amount: 1200, currency: "USD", type: "out", createdAt: "2026-07-29" },
  { name: "Acme Corp", amount: 1200, currency: "USD", type: "out", createdAt: "2026-08-12" },

  // Random one-off payments (should NOT trigger suggestion)
  { name: "Random Vendor", amount: 75, currency: "USD", type: "out", createdAt: "2026-07-10" },
  { name: "Random Vendor", amount: 120, currency: "USD", type: "out", createdAt: "2026-08-05" },

  // Existing wire-roll recipient (should be excluded)
  { name: "Jane Doe", amount: 300, currency: "USD", type: "out", createdAt: "2026-06-20" },
  { name: "Jane Doe", amount: 300, currency: "USD", type: "out", createdAt: "2026-07-20" },
  { name: "Jane Doe", amount: 300, currency: "USD", type: "out", createdAt: "2026-08-20" },
];

// Simulate existing wire-rolls (Jane Doe already has one)
const existingRolls = [
  { recipient: "Jane Doe" },
];

// Run the detector
const suggestions = detectRecurringPatterns(mockTransactions as any, existingRolls);

console.log("\n🔍 WIC Pattern Detection Results:\n");
console.log(`Found ${suggestions.length} suggestions:\n`);

suggestions.forEach((s, i) => {
  console.log(`${i + 1}. ${s.recipient} (${s.currency})`);
  console.log(`   Frequency: ${s.suggestedFrequency}`);
  console.log(`   Avg Amount: $${s.averageAmount}`);
  console.log(`   Confidence: ${s.confidence}%`);
  console.log(`   Transactions: ${s.transactionCount}`);
  if (s.typicalDayOfMonth) {
    console.log(`   Typical Day: ${s.typicalDayOfMonth}${getOrdinal(s.typicalDayOfMonth)} of month`);
  }
  console.log(`   Reason: ${s.reason}`);
  console.log("");
});

function getOrdinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}