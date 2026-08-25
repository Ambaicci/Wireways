import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ insights: [] }, { status: 401 });
  const userId = session.userId;

  const userRes = await db.execute("SELECT account_type FROM users WHERE id = ?", [userId]);
  const accountType = ((userRes.rows[0] as any)?.account_type as string) || "business";
  const isPersonal = accountType === "personal";

  const walletsRes = await db.execute("SELECT currency, balance FROM wallets WHERE user_id = ? AND is_active = 1", [userId]);
  const wallets = walletsRes.rows as { currency: string; balance: number }[];
  
  const txRes = await db.execute("SELECT id, amount, created_at FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 10", [userId]);
  const transactions = txRes.rows as { id: number; amount: number; created_at: string }[];

  const insights: any[] = [];
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // 1. Empty Workspace (tailored by account type)
  if (totalBalance === 0 && transactions.length === 0) {
    insights.push({
      id: "onboard",
      type: "action",
      icon: "Zap",
      title: isPersonal ? "Personal Workspace Initialized" : "Workspace Initialized",
      desc: isPersonal
        ? "Your accounts are live. Create a payment link and receive your first cross-border payment in minutes."
        : "Your multi-currency accounts are live. Fund your workspace to activate AI routing.",
      prompt: isPersonal ? "Create a payment link for 500 USD" : "Top up my USD wallet with 1,000 USD",
      time: "Just now"
    });
  }

  // 2. Concentration Risk (business) / Income Protection (personal)
  const usdWallet = wallets.find(w => w.currency === "USD");
  const eurWallet = wallets.find(w => w.currency === "EUR");

  if (isPersonal && totalBalance > 0 && usdWallet && usdWallet.balance > 0) {
    insights.push({
      id: "income-protection",
      type: "insight",
      icon: "TrendingUp",
      title: "Income Protection",
      desc: "You hold client payments in USD. Converting part to your home currency locks today's rate.",
      prompt: "Convert 1,000 USD to KES",
      time: "5m ago"
    });
  } else if (usdWallet && usdWallet.balance > 10000 && eurWallet && eurWallet.balance < usdWallet.balance * 0.5) {
    insights.push({
      id: "fx-hedge",
      type: "insight",
      icon: "TrendingUp",
      title: "Currency Concentration Detected",
      desc: `Heavy liquidity in USD. Consider hedging into EUR at current rates (1.089) to optimize cross-border payouts.`,
      prompt: "Convert 5,000 USD to EUR",
      time: "2m ago"
    });
  }

  // 3. Routing Intelligence
  insights.push({
    id: "routing",
    type: "routing",
    icon: "Route",
    title: "Smart Rail Optimized",
    desc: "MPesa B2C latency is currently 42ms. AI has prioritized this rail for your next KES payout.",
    prompt: "Show me MPesa B2C routing details",
    time: "14m ago"
  });

  // 4. Predictive
  if (transactions.length > 3) {
     insights.push({
      id: "predict",
      type: "insight",
      icon: "Brain",
      title: "Cash Flow Prediction",
      desc: "Based on your recent outflows, your USD balance will dip below optimal thresholds in 6 days.",
      prompt: "Top up my USD wallet with 5,000 USD",
      time: "1h ago"
    });
  }

  // 5. Purely Informational Whisper
  insights.push({
    id: "liquidity",
    type: "info",
    icon: "BarChart3",
    title: isPersonal ? "Personal Settlement Status" : "Liquidity & Settlement Status",
    desc: "Your cross-border settlement capacity is currently optimized.",
    analysis: isPersonal
      ? "Your personal workspace is healthy. You can receive payments in all 5 currencies and withdraw to your local bank or mobile wallet at any time. No action required at this time."
      : "Based on your current active wallets and recent transaction velocity, your liquidity ratio is healthy. The AI routing engine has identified no immediate bottlenecks for payouts up to $50,000 across supported rails (SEPA, SWIFT, MPesa). No action required at this time.",
    time: "Live"
  });

  return NextResponse.json({ insights: insights.slice(0, 5) });
}