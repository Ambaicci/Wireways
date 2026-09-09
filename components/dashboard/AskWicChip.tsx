"use client";

export default function AskWicChip() {
  return (
    <div
      onClick={() => window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: "" }))}
      className="flex items-center gap-2 border border-[#EAE6DF] bg-white px-3 py-1.5 rounded-[10px] cursor-pointer hover:border-[#8C8579] transition-colors"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#B3AC9F]">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <span className="text-[13px] text-[#B3AC9F] font-medium">Ask Wireways</span>
      <kbd className="font-mono text-[11px] bg-[#FAFAF9] border border-[#EAE6DF] rounded px-1 py-0.5 text-[#8C8579]">Ctrl K</kbd>
    </div>
  );
}
