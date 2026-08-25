"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Repeat } from "lucide-react";
import WicStar from "./WicStar";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

const ACCENT = "#7C8DB5";

export default function WireRollActions({ onNewRoll }: { onNewRoll: () => void }) {
  const [mode, setMode] = useState<"manual" | "wic">("manual");

  const handleManual = () => {
    setMode("manual");
    onNewRoll();
  };

  const handleWic = () => {
    setMode("wic");
    prefillDock("Create a wire-roll for monthly payroll of $45,000 USD to the engineering team");
  };

  const pill = (
    <motion.span
      layoutId="wirerollmode-pill"
      className="absolute inset-0 rounded-[9px] shadow-[0_6px_16px_rgba(124,141,181,0.25)]"
      style={{ background: ACCENT }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
    />
  );

  return (
    <div className="flex items-stretch rounded-[11px] border border-[#E8E0D4] bg-[#FFFDF9] p-1 shadow-[0_1px_2px_rgba(49,43,30,0.04)]">
      <button
        onClick={handleManual}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-[9px] text-[12.5px] font-bold transition-colors ${mode === "manual" ? "text-white" : "text-[#6E665A] hover:text-[#312B1E]"}`}
      >
        {mode === "manual" && pill}
        <span className="relative flex items-center gap-2"><Repeat className="w-4 h-4" /> New roll</span>
      </button>
      <button
        onClick={handleWic}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-[9px] text-[12.5px] font-bold transition-colors ${mode === "wic" ? "text-white" : "text-[#6E665A] hover:text-[#312B1E]"}`}
      >
        {mode === "wic" && pill}
        <span className="relative flex items-center gap-2"><WicStar className="w-3.5 h-3.5" /> Ask WIC</span>
      </button>
    </div>
  );
}