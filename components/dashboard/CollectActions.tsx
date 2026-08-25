"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import WicStar from "./WicStar";
import CreateLinkModal from "./CreateLinkModal";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

const ACCENT = "#B98A2E";

export default function CollectActions() {
  const [mode, setMode] = useState<"manual" | "wic">("manual");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManual = () => {
    setMode("manual");
    setIsModalOpen(true);
  };

  const handleWic = () => {
    setMode("wic");
    prefillDock("Create a payment link for $1,200 from Global Reach GmbH for the March design sprint");
  };

  const pill = (
    <motion.span
      layoutId="collectmode-pill"
      className="absolute inset-0 rounded-[9px] shadow-[0_6px_16px_rgba(185,138,46,0.25)]"
      style={{ background: ACCENT }}
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
          <span className="relative flex items-center gap-2"><Link2 className="w-4 h-4" /> New link</span>
        </button>
        <button
          onClick={handleWic}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-[9px] text-[12.5px] font-bold transition-colors ${mode === "wic" ? "text-white" : "text-[#6E665A] hover:text-[#312B1E]"}`}
        >
          {mode === "wic" && pill}
          <span className="relative flex items-center gap-2"><WicStar className="w-3.5 h-3.5" /> Ask WIC</span>
        </button>
      </div>
      {isModalOpen && <CreateLinkModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}