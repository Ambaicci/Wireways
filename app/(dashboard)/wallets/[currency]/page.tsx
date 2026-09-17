import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Calendar } from "lucide-react";
import WalletActions from "@/components/dashboard/WalletActions";
import CopyDetailsButton from "@/components/dashboard/CopyDetailsButton";
import TransactionHistoryList from "@/components/dashboard/TransactionHistoryList";

export const dynamic = 'force-dynamic';

const walletStyles: Record<string, { flag: string; bg: string }> = {
  USD: { flag: "🇺🇸", bg: "#E7F2EC" },
  EUR: { flag: "🇪", bg: "#EAEDF3" },
  GBP: { flag: "🇬", bg: "#F5F5F7" },
  USDC: { flag: "₿", bg: "#FDEBE0" },
  KES: { flag: "🇰", bg: "#E7F2EC" },
};

export default async function WalletDetailPage({ params }: { params: Promise<{ currency: string }> }) {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;
  
  const { currency } = await params;
  
  const walletRes = await db.execute(
    "SELECT id, currency, balance, bank, details FROM wallets WHERE user_id = $1 AND currency = $2 AND is_active = 1",
    [userId, currency]
  );

  if (walletRes.rows.length === 0) {
    notFound();
  }

  const wallet = walletRes.rows[0] as { id: number; currency: string; balance: number; bank: string; details: string };
  const style = walletStyles[currency] || walletStyles.USD;

  const txRes = await db.execute(
    "SELECT id, name, type, amount, status, rail, created_at, transaction_uuid FROM transactions WHERE user_id = $1 AND currency = $2 ORDER BY id DESC LIMIT 20",
    [userId, currency]
  );
  const transactions = txRes.rows as any[];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const recent = transactions.filter((t) => new Date(t.created_at) >= new Date(thirtyDaysAgo));
  const inflow = recent.filter((t) => t.type === "in").reduce((sum, t) => sum + Number(t.amount), 0);
  const outflow = recent.filter((t) => t.type === "out").reduce((sum, t) => sum + Number(t.amount), 0);

  const formatBalance = (amount: number) => {
    if (currency === 'USDC') return `${amount.toLocaleString()} USDC`;
    if (currency === 'KES') return `KSh ${amount.toLocaleString()}`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F6F5F3] pb-20">
      <main className="max-w-[900px] mx-auto px-6 pt-8 space-y-6">
        
        {/* Back Navigation */}
        <Link href="/wallets" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> 
          All wallets
        </Link>

        {/* Hero Balance Card */}
        <section className="bg-white border border-[#E5E5EA] rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[16px] flex items-center justify-center text-3xl shadow-sm" style={{ backgroundColor: style.bg }}>
                  {style.flag}
                </div>
                <div>
                  <h1 className="text-[24px] font-bold text-[#1D1D1F] tracking-tight">{currency} Wallet</h1>
                  <p className="text-[14px] font-medium text-[#86868B] mt-1">{wallet.bank}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2">Available balance</p>
                <h2 className="text-[clamp(36px,5vw,48px)] font-bold tracking-[-0.03em] text-[#1D1D1F] tabular-nums leading-none">
                  {formatBalance(wallet.balance)}
                </h2>
              </div>

              <div className="max-w-sm">
                <WalletActions currency={currency} balance={wallet.balance} />
              </div>
            </div>

            {/* Quick Stats Side Panel (Desktop) */}
            <div className="hidden md:flex flex-col gap-3 min-w-[220px]">
              <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-[16px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-[#287A55]" />
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">30-Day Inflow</span>
                </div>
                <div className="text-[20px] font-bold text-[#287A55] tabular-nums">+{formatBalance(inflow)}</div>
              </div>
              <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-[16px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#1D1D1F]" />
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">30-Day Outflow</span>
                </div>
                <div className="text-[20px] font-bold text-[#1D1D1F] tabular-nums">−{formatBalance(outflow)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Stats (Visible only on small screens) */}
        <div className="grid grid-cols-2 md:hidden gap-3">
           <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-4">
              <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">30-Day Inflow</div>
              <div className="text-[18px] font-bold text-[#287A55] tabular-nums">+{formatBalance(inflow)}</div>
            </div>
            <div className="bg-white border border-[#E5E5EA] rounded-[16px] p-4">
              <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">30-Day Outflow</div>
              <div className="text-[18px] font-bold text-[#1D1D1F] tabular-nums">−{formatBalance(outflow)}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Local Account Details */}
          <section className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="text-[15px] font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F1622C]" /> Local account details
            </h3>
            <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-[14px] p-4 flex items-center justify-between group">
              <div className="min-w-0 flex-1 mr-4">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Account Information</p>
                <p className="text-[14px] font-mono font-semibold text-[#1D1D1F] truncate">{wallet.details}</p>
              </div>
              <CopyDetailsButton text={wallet.details} />
            </div>
          </section>

          {/* Recent Activity Preview */}
          <section className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
             <h3 className="text-[15px] font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#4C5C88]" /> Recent Activity
            </h3>
            <div className="space-y-1">
              {transactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[13px] font-medium text-[#86868B]">No transactions yet.</p>
                </div>
              ) : (
                transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-[#F5F5F7] last:border-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "in" ? "bg-[#E7F2EC]" : "bg-[#F5F5F7]"}`}>
                      {tx.type === "in" ? <ArrowDownLeft className="w-4 h-4 text-[#287A55]" /> : <ArrowUpRight className="w-4 h-4 text-[#86868B]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#1D1D1F] truncate">{tx.name}</div>
                      <div className="text-[11px] font-medium text-[#86868B] mt-0.5">{tx.rail} · {formatDate(tx.created_at)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-semibold text-[13px] tabular-nums ${tx.type === "in" ? "text-[#287A55]" : "text-[#1D1D1F]"}`}>
                        {tx.type === "in" ? "+" : "−"}{formatBalance(tx.amount)}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 inline-block ${tx.status === "Completed" ? "bg-[#E7F2EC] text-[#287A55]" : "bg-[#FFF8E1] text-[#9C6B08]"}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Full Transaction History (Interactive) */}
        <section className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-bold text-[#1D1D1F]">Full Transaction History</h3>
            <span className="text-[11px] font-bold text-[#86868B] bg-[#F5F5F7] px-2.5 py-1 rounded-full">{transactions.length} total</span>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-[#86868B]" />
              </div>
              <p className="text-[14px] font-medium text-[#86868B]">No transactions yet for this wallet.</p>
              <p className="text-[12px] text-[#A8A29E] mt-1">Your activity will appear here.</p>
            </div>
          ) : (
            <TransactionHistoryList transactions={transactions} currency={currency} />
          )}
        </section>

      </main>
    </div>
  );
}