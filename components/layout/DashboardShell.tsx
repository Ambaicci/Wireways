"use client";

import { useState } from "react";
import { Send, Download, Repeat, Plus, Search, Command, SlidersHorizontal } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AiCommandBar from "@/components/dashboard/AiCommandBar";
import MobileNav from "@/components/dashboard/MobileNav";
import SendMoneyModal from "@/components/dashboard/SendMoneyModal";
import CreateLinkModal from "@/components/dashboard/CreateLinkModal";
import SmartTableModal from "@/components/dashboard/SmartTableModal";
import AddFundsModal from "@/components/dashboard/AddFundsModal";

export default function DashboardShell({ 
  children, 
  label, 
  initials,
  wallets,
  contacts,
  virtualAccount
}: { 
  children: React.ReactNode; 
  label: string; 
  initials: string; 
  wallets: { currency: string; balance: number }[];
  contacts: { id: string; name: string; email: string }[];
  virtualAccount: { number: string; bank: string } | null;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  // Modal States
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Helper to trigger the AI Dock
  const triggerDock = (text: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
    }
  };

  const quickActions = [
    { label: "Send", icon: Send, prompt: "Send 50,000 KES to John", manual: () => setIsSendOpen(true) },
    { label: "Convert", icon: Repeat, prompt: "Convert 10,000 USD to EUR", manual: () => setIsConvertOpen(true) },
    { label: "Request", icon: Download, prompt: "Request 1,200 USD", manual: () => setIsRequestOpen(true) },
    { label: "Top up", icon: Plus, prompt: "Top up my USD wallet", manual: () => setIsTopUpOpen(true) },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#F6F5F3]">
      {/* Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen z-30">
        <DashboardSidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />
      </div>

      <MobileNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* ── NEW COMMAND NAVBAR ─── */}
        <header className="hidden md:flex sticky top-0 z-40 items-center justify-between px-6 py-3 bg-[#F6F5F3]/90 backdrop-blur-md border-b border-[#F1EEE8]">
          {/* Left Spacer (Keeps layout balanced) */}
          <div className="flex-1" />

          {/* Right Cluster: Pills + Search + Avatar */}
          <div className="flex items-center gap-4">
            
            {/* Functional Pills (Heading left from search) */}
            <div className="flex items-center gap-1.5">
              {quickActions.map((action) => (
                <div 
                  key={action.label} 
                  className="flex items-stretch rounded-full overflow-hidden border border-[#EAE6DF] bg-white shadow-sm flex-shrink-0"
                >
                  <button
                    onClick={() => triggerDock(action.prompt)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-none border-none cursor-pointer text-[#1C1917] transition-colors duration-150 hover:bg-[#F5F5F4]"
                  >
                    <action.icon className="w-3.5 h-3.5" style={{ color: "#F1622C" }} />
                    <span className="text-[11px] font-bold">{action.label}</span>
                  </button>
                  <button
                    onClick={action.manual}
                    className="w-[28px] flex items-center justify-center border-none border-l border-[#EAE6DF] bg-none cursor-pointer text-[#D6D3D1] transition-colors duration-150 hover:text-[#57534E] hover:bg-[#F5F5F4]"
                    title={`Open manual ${action.label} form`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Search / Ask WIC Bar (Far Right) */}
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E] group-focus-within:text-[#F1622C] transition-colors" />
              <input
                type="text"
                placeholder="Ask WIC or search..."
                className="w-64 pl-10 pr-12 py-2 rounded-full bg-white border border-[#EAE6DF] text-[13px] text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all shadow-sm"
                onFocus={() => triggerDock("")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    triggerDock(e.currentTarget.value);
                    e.currentTarget.value = "";
                    e.currentTarget.blur();
                  }
                }}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-[#8C8579] font-medium bg-[#F6F5F3] px-1.5 py-0.5 rounded border border-[#EAE6DF]">
                <Command className="w-3 h-3" /> K
              </div>
            </div>

            {/* User Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F1622C] to-[#FF9A6B] flex items-center justify-center text-white text-[12px] font-semibold shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              title={label}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 md:pt-6 pb-48 bg-[#F6F5F3]">
          {children}
        </main>
      </div>

      {/* Smart Dock Wrapper */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300 ease-in-out"
        style={{ paddingLeft: isSidebarCollapsed ? '72px' : '228px' }}
      >
        <div className="w-full max-w-[720px] pointer-events-auto pb-0 px-4">
          <AiCommandBar />
        </div>
      </div>

      {/* Modals */}
      {isSendOpen && <SendMoneyModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} wallets={wallets} />}
      {isRequestOpen && <CreateLinkModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} contacts={contacts} />}
      {isConvertOpen && <SmartTableModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} />}
      {isTopUpOpen && <AddFundsModal currency="USD" isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} virtualAccount={virtualAccount} />}
    </div>
  );
}