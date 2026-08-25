"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ArrowDown, RefreshCw } from "lucide-react";
import WicStar from "./WicStar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT = "#7C8DB5";
const ACCENT_SOFT = "rgba(124,141,181,0.14)";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

export default function ConvertCurrencyModal({ isOpen, onClose }: Props) {
  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState("USD");
  const [receiveCurrency, setReceiveCurrency] = useState("EUR");

  const [liveRate, setLiveRate] = useState(0.92);
  const [avgRate, setAvgRate] = useState<number | null>(null);
  const [deltaText, setDeltaText] = useState<string | null>(null);

  // Fetch live WIC rate context when open
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    fetch("/api/wic/briefing")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return;
        const fx = d.briefing?.watching?.find((w: any) => w.category === "fx" && w.target === receiveCurrency);
        if (fx) {
          setLiveRate(fx.rate);
          setAvgRate(fx.avgRate ?? null);
          setDeltaText(fx.deltaText ?? null);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [isOpen, receiveCurrency]);

  if (!isOpen) return null;

  const payNum = parseFloat(payAmount) || 0;
  const receiveAmount = (payNum * liveRate).toFixed(2);
  const isAbove = deltaText?.includes("above");

  const handleConvert = () => {
    if (payNum <= 0) return;
    prefillDock(`Convert ${payNum} ${payCurrency} to ${receiveCurrency}`);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#312B1E]/40 backdrop-blur-[7px] p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#FFFDF9] rounded-t-[23px] md:rounded-[23px] w-full md:max-w-[420px] shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-[#E8E0D4] overflow-hidden"
        initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1EADF]">
          <div className="flex items-center gap-2.5">
            <WicStar className="w-4 h-4" style={{ color: ACCENT } as any} />
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#312B1E]">Convert currency</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D8476] hover:bg-[#F5EFE6] hover:text-[#312B1E] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* YOU PAY */}
          <div>
            <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">You pay</label>
            <div className="relative mt-1.5 flex items-center gap-3 bg-[#FFFBF6] border border-[#E8E0D4] rounded-[12px] p-3 focus-within:border-[#F1622C]/60 transition-colors">
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: ACCENT, opacity: 0.4 }} />
              <input
                type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent border-none outline-none text-[22px] font-mono font-semibold text-[#312B1E] tabular-nums placeholder:text-[#B3AC9F] pl-2"
                autoFocus
              />
              <select
                value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}
                className="bg-white border border-[#E8E0D4] rounded-[9px] px-3 py-1.5 text-[13px] font-bold text-[#312B1E] outline-none cursor-pointer"
              >
                <option value="USD">USD</option><option value="EUR">EUR</option>
                <option value="GBP">GBP</option><option value="KES">KES</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-1 relative z-10">
            <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-full p-1.5 shadow-sm">
              <ArrowDown className="w-4 h-4" style={{ color: ACCENT } as any} />
            </div>
          </div>

          {/* YOU RECEIVE */}
          <div>
            <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">You receive</label>
            <div className="relative mt-1.5 flex items-center gap-3 bg-[#FFFBF6] border rounded-[12px] p-3" style={{ borderColor: `${ACCENT}66` }}>
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: ACCENT, opacity: 0.6 }} />
              <div className="flex-1 text-[22px] font-mono font-semibold text-[#312B1E] tabular-nums pl-2">
                {payNum > 0 ? receiveAmount : "0.00"}
              </div>
              <select
                value={receiveCurrency} onChange={(e) => setReceiveCurrency(e.target.value)}
                className="bg-white border border-[#E8E0D4] rounded-[9px] px-3 py-1.5 text-[13px] font-bold text-[#312B1E] outline-none cursor-pointer"
              >
                <option value="EUR">EUR</option><option value="USD">USD</option>
                <option value="GBP">GBP</option><option value="KES">KES</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* WIC rate context */}
          <div className="rounded-[12px] border px-4 py-3" style={{ backgroundColor: ACCENT_SOFT, borderColor: `${ACCENT}33` }}>
            <div className="flex items-start gap-2.5">
              <WicStar className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT } as any} />
              <div className="flex-1">
                <div className="text-[11px] font-bold text-[#312B1E] uppercase tracking-[0.08em]">Live mid-market rate</div>
                <div className="font-mono text-[16px] font-bold text-[#312B1E] tabular-nums mt-1">
                  1 {payCurrency} = {liveRate.toFixed(4)} {receiveCurrency}
                </div>
                {avgRate && deltaText && (
                  <p className={`text-[11.5px] mt-1.5 leading-[1.5] ${isAbove ? "text-[#287A55]" : "text-[#6E665A]"}`}>
                    That's <span className="font-bold">{deltaText}</span> your recent average of {avgRate.toFixed(4)}.
                    {isAbove && " A favorable window for you."}
                  </p>
                )}
              </div>
              <RefreshCw className="w-3.5 h-3.5" style={{ color: ACCENT } as any} />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleConvert}
            disabled={!payAmount || payNum <= 0}
            className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-[12px] text-[13.5px] font-bold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_6px_16px_rgba(124,141,181,0.25)]"
            style={{ background: ACCENT }}
          >
            <WicStar className="w-4 h-4" /> Convert with WIC
          </button>
          <p className="text-center text-[11px] text-[#8D8476] mt-2.5">
            WIC will show a full receipt before executing.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}