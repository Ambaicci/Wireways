import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, EyeOff } from "lucide-react";
import ManageWalletsButton from "@/components/dashboard/ManageWalletsButton";
import { observeWorld } from "@/wic/observe";

export const dynamic = 'force-dynamic';

const walletColors: Record<string, string> = {
  USD: "#F1622C",
  EUR: "#7C8DB5",
  GBP: "#7C6B51",
  USDC: "#287A55",
  KES: "#B98A2E",
};

const walletNames: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  USDC: "USD Coin",
  KES: "Kenyan Shilling",
};

export default async function WalletsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const userId = session.userId;

  // WIC observes the world — total, liquidity, live USD equivalents
  const world = await observeWorld(userId);

  const result = await db.execute(
    "SELECT currency, balance, is_active FROM wallets WHERE user_id = ? ORDER BY id ASC",
    [userId]
  );
  const wallets = result.rows.map((row) => {
    const currency = row.currency as string;
    const balance = Number(row.balance) || 0;
    const rate = world.fx.usdRates[currency] ?? 1;
    return {
      currency,
      balance,
      isActive: row.is_active === 1,
      usdValue: rate > 0 ? balance / rate : 0,
    };
  });

  const formatBalance = (amount: number, currency: string) => {
    if (currency === 'USDC') return `${amount.toLocaleString()} USDC`;
    if (currency === 'KES') return `KSh ${amount.toLocaleString()}`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="max-w-[880px] mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Money</h1>
          <p className="text-[13px] text-[#8D8476] mt-1">Your wallets and accounts across currencies.</p>
        </div>
        <ManageWalletsButton
          wallets={wallets.map((w) => ({ currency: w.currency, is_active: w.isActive ? 1 : 0 }))}
        />
      </div>

      {/* WIC money summary */}
      <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[22px] p-6 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
        <div className="flex justify-between items-start gap-5 flex-wrap">
          <div>
            <div className="text-[11px] text-[#8D8476] font-bold uppercase tracking-[0.08em]">Total available balance</div>
            <div className="mt-1 text-[40px] font-bold tracking-[-0.055em] text-[#312B1E] tabular-nums">
              ${Math.floor(world.totalUsd).toLocaleString()}
              <small className="text-[19px] text-[#A9A093] font-medium">
                .{String(Math.round((world.totalUsd % 1) * 100)).padStart(2, "0")}
              </small>
            </div>
            <p className="text-[12px] text-[#8D8476] mt-1">
              {world.wallets
                .filter((w) => w.usdValue > 0)
                .sort((a, b) => b.usdValue - a.usdValue)
                .slice(0, 3)
                .map((w) => `${w.currency} ${Math.round((w.usdValue / Math.max(world.totalUsd, 1)) * 100)}%`)
                .join(" · ")}
            </p>
          </div>
          <div className="bg-[#E8F3EC] text-[#287A55] rounded-[10px] px-3 py-2 text-[11px] font-bold">
            <span className="block text-[13px] mb-0.5">
              {world.liquidityDays >= 14 ? "Healthy" : world.liquidityDays >= 7 ? "Stable" : "Tight"}
            </span>
            {world.liquidityDays} days of liquidity
          </div>
        </div>
      </section>

      {/* Wallet list */}
      <div className="flex flex-col gap-3">
        {wallets.map((w) => {
          const color = walletColors[w.currency] || "#B3AC9F";
          const name = walletNames[w.currency] || w.currency;

          return (
            <Link
              key={w.currency}
              href={`/wallets/${w.currency}`}
              className={`flex items-center justify-between bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] p-5 text-[#312B1E] no-underline hover:border-[#DDCDBA] hover:shadow-[0_10px_30px_rgba(49,43,30,0.06)] transition-all group ${!w.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-white text-[11px] font-bold font-mono"
                  style={{ backgroundColor: color }}
                >
                  {w.currency}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-semibold">{name}</div>
                    {!w.isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8D8476] bg-[#F5EFE6] px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Hidden
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#8D8476] mt-0.5">
                    {w.isActive ? "Active" : "Hidden from dashboard"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="font-mono text-[16px] font-semibold tabular-nums">
                    {formatBalance(w.balance, w.currency)}
                  </div>
                  <div className="text-[11px] text-[#8D8476] mt-0.5">≈ ${Math.round(w.usdValue).toLocaleString()}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#B3AC9F] group-hover:text-[#312B1E] transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}