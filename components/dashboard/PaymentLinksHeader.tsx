"use client";

import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import CreateLinkModal from "./CreateLinkModal";

export default function PaymentLinksHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAskWic = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("prefill-ai-dock", { 
        detail: "Create a payment link for " 
      }));
    }
  };

  const handleCreated = () => {
    setIsModalOpen(false);
    // Refresh the server component to show the new link
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("refresh-payment-links"));
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#4C5C88] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3A4A6B] transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Link
        </button>
        <button 
          onClick={handleAskWic}
          className="px-4 py-2.5 bg-[#1C1917] text-white rounded-xl text-[13px] font-semibold hover:bg-black transition-colors shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-[#F1622C]" /> Ask WIC
        </button>
      </div>

      {isModalOpen && (
        <CreateLinkModal 
          onClose={() => setIsModalOpen(false)} 
          onCreated={handleCreated}
        />
      )}
    </>
  );
}