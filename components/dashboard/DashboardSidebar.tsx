"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  Send,
  Download,
  CalendarClock,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Code2, // <-- ADD THIS
} from "lucide-react";
import WicIcon from "@/components/ui/WicIcon";

// Updated naming for precision and professionalism
const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Payments", href: "/payments", icon: Send },
  { name: "Collect", href: "/payment-links", icon: Download },
  { name: "Wire-roll", href: "/wire-roll", icon: CalendarClock },
  { name: "Cards", href: "/payment-methods", icon: CreditCard },
];

export default function DashboardSidebar({ 
  isCollapsed, 
  setIsCollapsed 
}: { 
  isCollapsed: boolean; 
  setIsCollapsed: (val: boolean) => void; 
}) {
  const pathname = usePathname();
  const [wicScore, setWicScore] = useState<number | null>(null);

  // Live WIC score for the sidebar pulse
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/wic/briefing");
        if (!r.ok) return;
        const d = await r.json();
        const s = d?.score ?? d?.wicScore ?? d?.calibration?.score ?? d?.briefing?.score;
        if (alive && typeof s === "number") setWicScore(s);
      } catch {
        // Silent: the dot remains, the score stays hidden if unavailable
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    // Updated to crisp white background with Apple-like subtle border
    <aside className={`${isCollapsed ? "w-[72px]" : "w-[228px]"} transition-all duration-300 ease-in-out h-full bg-white border-r border-[#E5E5EA] flex flex-col`}>
      
      {/* Header: Brand (Clickable) + Toggle Button */}
      <div className={`flex items-center ${isCollapsed ? "flex-col gap-3" : "justify-between"} px-4 pt-5 pb-4 flex-shrink-0`}>
        <Link href="/" className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`} title="Back to Wireways home">
          <div className="w-8 h-8 rounded-lg bg-[#F1622C] flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          {!isCollapsed && <span className="text-[15px] font-bold text-[#1D1D1F] tracking-tight">Wireways</span>}
        </Link>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-all"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
                isCollapsed ? "justify-center py-2.5" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-[#F1622C] text-white shadow-[0_4px_12px_rgba(241,98,44,0.25)]"
                  : "text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
              }`}
            >
              {/* Bumped all icons to w-5 h-5 for perfect visual weight */}
              <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && <span className="tracking-tight">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: WIC Intelligence + Settings */}
      <div className="px-3 pb-5 pt-2 space-y-1 flex-shrink-0 border-t border-[#E5E5EA] mt-2">
        {/* WIC Link with Proprietary Icon */}
        <Link
          href="/wic"
          title="WIC Intelligence & OpenWIC Gateway"
          className={`flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
            isCollapsed ? "justify-center py-2.5" : "px-3 py-2.5"
          } ${
            pathname === "/wic" || pathname.startsWith("/wic/")
              ? "bg-[#F1622C] text-white shadow-[0_4px_12px_rgba(241,98,44,0.25)]"
              : "text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
          }`}
        >
          <span className="relative flex items-center justify-center flex-shrink-0">
            {/* Bumped WIC icon to w-5 h-5 to perfectly match other icons */}
            <WicIcon className={`w-8 h-8 ${pathname === "/wic" || pathname.startsWith("/wic/") ? "text-white" : "text-[#F1622C]"}`} />
            {/* Live pulse indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-[#F1622C] border-2 border-white" />
          </span>
          {!isCollapsed && (
            <>
              <span className="flex-1 tracking-tight">WIC</span>
              {wicScore !== null && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  pathname === "/wic" || pathname.startsWith("/wic/") 
                    ? "bg-white/20 text-white" 
                    : "bg-[#F1622C]/10 text-[#F1622C]"
                }`}>
                  {wicScore}
                </span>
              )}
            </>
          )}
        </Link>

              {/* OpenWIC Developer Gateway */}
        <Link
          href="/openwic"
          title="OpenWIC Developer Gateway"
          className={`flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
            isCollapsed ? "justify-center py-2.5" : "px-3 py-2.5"
          } ${
            pathname === "/openwic" || pathname.startsWith("/openwic/")
              ? "bg-[#0F172A] text-white shadow-[0_4px_12px_rgba(15,23,42,0.25)]"
              : "text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
          }`}
        >
          <Code2 className="w-5 h-5 flex-shrink-0" strokeWidth={pathname === "/openwic" || pathname.startsWith("/openwic/") ? 2.5 : 2} />
          {!isCollapsed && <span className="tracking-tight">OpenWIC</span>}
        </Link>
       
        <Link
          href="/settings"
          title="Settings"
          className={`flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
            isCollapsed ? "justify-center py-2.5" : "px-3 py-2.5"
          } ${
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-[#F1622C] text-white shadow-[0_4px_12px_rgba(241,98,44,0.25)]"
              : "text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
          }`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={pathname === "/settings" || pathname.startsWith("/settings/") ? 2.5 : 2} />
          {!isCollapsed && <span className="tracking-tight">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}