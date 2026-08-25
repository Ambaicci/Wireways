"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  Send,
  Link as LinkIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CalendarClock,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/lib/actions";
import { toast } from "@/components/ui/Toaster";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Payments", href: "/payments", icon: Send },
  { name: "Payment Links", href: "/payment-links", icon: LinkIcon },
  { name: "Wire-roll", href: "/wire-roll", icon: CalendarClock },
  { name: "Payment Methods", href: "/payment-methods", icon: CreditCard },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    toast("Logged out successfully. See you soon!", "success");
    // Hard redirect: flushes the Next.js client-side cache so the
    // middleware re-evaluates auth from scratch. No more bounce-back.
    window.location.href = "/";
  };

  return (
    <motion.aside
      className={`bg-white border-r border-[#EAE6DF] sticky top-0 h-screen flex flex-col ${isCollapsed ? "w-[76px]" : "w-[252px]"}`}
      animate={{ width: isCollapsed ? 76 : 252 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Header with Logo and Toggle */}
      <div className="flex items-center justify-between px-[14px] py-[18px]">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-[30px] h-[30px] rounded-[9px] bg-[#F1622C] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span className="text-[15.5px] font-semibold text-[#18140F] tracking-tight whitespace-nowrap">
              Wireways
            </span>
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-[22px] h-[22px] rounded-[6px] border border-[#EAE6DF] bg-white text-[#8C8579] flex items-center justify-center flex-shrink-0 hover:text-[#18140F] transition-all ${isCollapsed ? "mx-auto" : ""}`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-[14px] space-y-[2px]">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-[11px] rounded-[10px] text-[13.5px] font-medium transition-all ${
                isCollapsed ? "justify-center py-[9px]" : "px-[11px] py-[9px]"
              } ${
                isActive
                  ? "bg-[#F1622C] text-white"
                  : "text-[#4E4841] hover:bg-[#FAFAF9] hover:text-[#18140F]"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`w-[17px] h-[17px] flex-shrink-0 ${isActive ? "text-white" : ""}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings & Logout at Bottom */}
      <div className="px-[14px] pb-[18px] mt-auto space-y-[2px]">
        <Link
          href="/settings"
          className={`flex items-center gap-[11px] rounded-[10px] text-[13.5px] font-medium text-[#4E4841] hover:bg-[#FAFAF9] hover:text-[#18140F] transition-all ${
            isCollapsed ? "justify-center py-[9px]" : "px-[11px] py-[9px]"
          }`}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-[17px] h-[17px] flex-shrink-0" />
          {!isCollapsed && "Settings"}
        </Link>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-[11px] w-full rounded-[10px] text-[13.5px] font-medium text-[#4E4841] hover:bg-[#FBF1DA] hover:text-[#C94A1D] transition-all ${
            isCollapsed ? "justify-center py-[9px]" : "px-[11px] py-[9px]"
          }`}
          title={isCollapsed ? "Log out" : undefined}
        >
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" />
          {!isCollapsed && "Log out"}
        </button>
      </div>
    </motion.aside>
  );
}