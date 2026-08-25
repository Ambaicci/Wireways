"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Send, Download, CreditCard, CalendarClock } from "lucide-react";
import { BrandMark } from "@/components/auth/AuthLayout";

const tabs = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Money", href: "/wallets", icon: Wallet },
  { name: "Pay", href: "/payments", icon: Send },
  { name: "Collect", href: "/payment-links", icon: Download },
  { name: "Roll", href: "/wire-roll", icon: CalendarClock },
  { name: "Cards", href: "/payment-methods", icon: CreditCard },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar (logout moved to Settings) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#FFFDF9]/90 backdrop-blur-xl border-b border-[#E8E0D4] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F1622C] flex items-center justify-center shadow-[0_4px_12px_rgba(241,98,44,0.25)]">
            <BrandMark className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-extrabold tracking-[-0.03em] text-[#312B1E] leading-none">Wireways</span>
            <span className="text-[7px] tracking-[0.16em] text-[#7C6B51] mt-[2px]">FINANCIAL OS</span>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-xl border-t border-[#E8E0D4] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className="flex flex-col items-center gap-1 py-2.5">
                <t.icon className={`w-5 h-5 ${active ? "text-[#F1622C]" : "text-[#B3AC9F]"}`} />
                <span className={`text-[9.5px] font-semibold ${active ? "text-[#F1622C]" : "text-[#8D8476]"}`}>
                  {t.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}