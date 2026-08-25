"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import WicStar from "./WicStar";
import SendMoneyModal from "./SendMoneyModal";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

export default function PayActions({ wallets }: { wallets: any[] }) {
  const [mode, setMode] = useState<"manual" | "wic">("manual");
  const [isSendOpen, setIsSendOpen] = useState(false);

  const handleManual = () => {
    setMode("manual");
    setIsSendOpen(true);
  };

  const handleWic = () => {
    setMode("wic");
    prefillDock("Send 50,000 KES to my MPesa");
  };

  const pill = (
    <motion.span
      layoutId="paymode-pill"
      className="absolute inset-0 rounded-[9px] bg-[#F1622C] shadow-[0_6px_16px_rgba(241,98,44,0.25)]"
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
    />
  );

  return (
    <>
      <div className="flex items-stretch rounded-[11px] border border-[#E8E0D4] bg-[#FFFDF9] p-1 shadow-[0_1px_2px_rgba(49,43,30,0.04)]">
        <button
          onClick={handleManual}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-[9px] text-[12.5px] font-bold transition-colors ${mode === "manual" ? "text-white" : "text-[#6E665A] hover:text-[#312B1E]"}`}
        >
          {mode === "manual" && pill}
          <span className="relative flex items-center gap-2"><Plus className="w-4 h-4" /> New Payment</span>
        </button>
        <button
          onClick={handleWic}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-[9px] text-[12.5px] font-bold transition-colors ${mode === "wic" ? "text-white" : "text-[#6E665A] hover:text-[#312B1E]"}`}
        >
          {mode === "wic" && pill}
          <span className="relative flex items-center gap-2"><WicStar className="w-3.5 h-3.5" /> Ask WIC</span>
        </button>
      </div>
      {isSendOpen && <SendMoneyModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} wallets={wallets} />}
    </>
  );
}