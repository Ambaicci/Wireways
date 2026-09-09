"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export default function CopyLinkButton({ linkId }: { linkId: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/pay/${linkId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
        copied 
          ? "bg-[#287A55]/10 border-[#287A55]/30 text-[#287A55]" 
          : "border-[#E7E5E4] text-[#57534E] hover:text-[#312B1E] hover:border-[#D6D3D1] opacity-60 group-hover:opacity-100"
      }`}
    >
      <span className="flex items-center gap-1.5">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy Link"}
      </span>
    </button>
  );
}