import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, BrainCircuit, TrendingUp, Calendar } from "lucide-react";
import WalletActions from "@/components/dashboard/WalletActions";
import CopyDetailsButton from "@/components/dashboard/CopyDetailsButton";

export const dynamic = 'force-dynamic';

const walletStyles: Record<string, { flag: string; bg: string }> = {
  USD: { flag: "🇺🇸", bg: "#E7F5EC" },
  EUR: { flag: "🇪🇺", bg: "#EAEDF5" },
  GBP: { flag: "🇬🇧", bg: "#EDE9FE" },
  USDC: { flag: "₿", bg: "#F6F5F3" },
  KES: { flag: "🇰🇪", bg: "#FDEBE0" },
};

export default async function WalletDetailPage({ params }: { params: Promise<{ currency: string }> }) {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;
  
  const { currency } = await params;
  
  // Multi-tenant: MUST filter by user_id
  const walletRes = await db.execute(
    "SELECT id, currency, balance, bank, details FROM wallets WHERE user_id = $1 AND currency = $2 AND is_active = 1",
    [userId, currency]
  );

  if (walletRes.rows.length === 0) {
    notFound();
  }

  const wallet = walletRes.rows[0] as { id: number; currency: string; balance: number; bank: string; details: string };
  const style = walletStyles[currency] || walletStyles.USD;

  // Fetch transactions for this user AND this currency
  const txRes = await db.execute(
    "SELECT id, name, type, amount, status, rail, created_at FROM transactions WHERE user_id = $1 AND currency = $2 ORDER BY id DESC LIMIT 20",
    [userId, currency]
  );
  const transactions = txRes.rows as any[];

  // Aggregate stats (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const recent = transactions.filter((t) => new Date(t.created_at) >= new Date(thirtyDaysAgo));
  const inflow = recent.filter((t) => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
  const outflow = recent.filter((t) => t.type === "out").reduce((sum, t) => sum + t.amount, 0);

  const formattedBalance = currency === 'USDC' ? `${wallet.balance.toLocaleString()} USDC` :
                         currency === 'KES' ? `KSh ${wallet.balance.toLocaleString()}` :
                         new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(wallet.balance);

  const formatTxAmount = (amount: number) => {
    if (currency === 'USDC') return `${amount.toLocaleString()} USDC`;
    if (currency === 'KES') return `KSh ${amount.toLocaleString()}`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
      <Link href="/wallets" className="inline-flex items-center gap-2 text-[13px] text-[#8C8579] hover:text-[#18140F] transition-colors">
        <ArrowLeft className="w-4 h-4" /> All wallets
      </Link>

      {/* Hero balance card */}
      <div className="bg-white border border-[#EAE6DF] rounded-[20px] p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl" style={{ backgroundColor: style.bg }}>
            {style.flag}
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#18140F] tracking-tight">{currency} Wallet</h1>
            <p className="text-[13px] text-[#8C8579]">{wallet.bank}</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider mb-2">Available balance</p>
          <h2 className="text-[44px] font-semibold tracking-tight text-[#18140F] tabular-nums leading-none">
            {formattedBalance}
          </h2>
        </div>

        <WalletActions currency={currency} balance={wallet.balance} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#EAE6DF] rounded-[14px] p-4">
          <div className="text-[10.5px] font-semibold text-[#B3AC9F] uppercase tracking-wider">30-day inflow</div>
          <div className="font-sans text-[22px] font-semibold text-[#17824A] mt-1 tabular-nums">
            +{formatTxAmount(inflow)}
          </div>
        </div>
        <div className="bg-white border border-[#EAE6DF] rounded-[14px] p-4">
          <div className="text-[10.5px] font-semibold text-[#B3AC9F] uppercase tracking-wider">30-day outflow</div>
          <div className="font-sans text-[22px] font-semibold text-[#18140F] mt-1 tabular-nums">
            −{formatTxAmount(outflow)}
          </div>
        </div>
        <div className="bg-white border border-[#EAE6DF] rounded-[14px] p-4">
          <div className="text-[10.5px] font-semibold text-[#B3AC9F] uppercase tracking-wider">Transactions</div>
          <div className="font-sans text-[22px] font-semibold text-[#4C5C88] mt-1 tabular-nums">{recent.length}</div>
        </div>
      </div>

      {/* Local Account Details */}
      <div className="bg-white border border-[#EAE6DF] rounded-[16px] p-6">
        <h3 className="text-[13px] font-semibold text-[#18140F] mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F1622C]" /> Local account details
        </h3>
        <div className="bg-[#FAFAF9] border border-[#EAE6DF] rounded-[10px] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-wider mb-1">Account Information</p>
            <p className="text-[13px] font-mono font-semibold text-[#18140F]">{wallet.details}</p>
          </div>
          <CopyDetailsButton text={wallet.details} />
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white border border-[#EAE6DF] rounded-[16px] p-5">
        <h3 className="text-[13px] font-semibold text-[#18140F] mb-4">Transaction history</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-[#8C8579]">No transactions yet for this wallet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-[#F1EEE8] last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === "in" ? "bg-[#E7F5EC]" : "bg-[#FAFAF9]"}`}>
                  {tx.type === "in" ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#17824A]" /> : <ArrowUpRight className="w-3.5 h-3.5 text-[#8C8579]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#18140F] truncate">{tx.name}</div>
                  <div className="text-[11px] text-[#8C8579] mt-0.5">{tx.rail} · {formatDate(tx.created_at)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-mono text-[13px] font-semibold ${tx.type === "in" ? "text-[#17824A]" : "text-[#18140F]"}`}>
                    {tx.type === "in" ? "+" : "−"}{formatTxAmount(tx.amount)}
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block ${tx.status === "Completed" ? "bg-[#E7F5EC] text-[#17824A]" : "bg-[#FBF1DA] text-[#9C6B08]"}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}