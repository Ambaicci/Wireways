"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLinkButton({ linkId }: { linkId: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // In a production app, this would be the actual public payment link URL
    const url = `${window.location.origin}/pay/${linkId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-2 rounded-lg hover:bg-[#F1EEE8] text-[#B3AC9F] hover:text-[#F1622C] transition-colors"
      title="Copy payment link"
    >
      {copied ? <Check className="w-4 h-4 text-[#17824A]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}