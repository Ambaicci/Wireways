"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyDetailsButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 rounded-lg text-[#8C8579] hover:text-[#F1622C] hover:bg-[#FDEBE0] transition-all" title="Copy details">
      {copied ? <Check className="w-4 h-4 text-[#17824A]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}