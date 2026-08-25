"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, Bookmark, BrainCircuit, Clock, Globe2, Zap, TrendingUp, ChevronDown, Activity, Maximize2, Minimize2 } from "lucide-react";

interface SmartTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES: Record<string, { name: string; color: string }> = {
  USD: { name: "US Dollar", color: "#F1622C" },
  EUR: { name: "Euro", color: "#4C5C88" },
  GBP: { name: "British Pound", color: "#8791B3" },
  USDC: { name: "USD Coin", color: "#17824A" },
  KES: { name: "Kenyan Shilling", color: "#B3AC9F" },
};
const CODES = Object.keys(CURRENCIES);

const usdPerUnit: Record<string, number> = {
  USD: 1, EUR: 1.0892, GBP: 1.2704, USDC: 1.0001, KES: 1 / 129.45,
};

const routeByCurrency: Record<string, { rail: string; eta: string; feePct: number }> = {
  EUR: { rail: "SEPA Instant", eta: "~10 sec", feePct: 0.1 },
  GBP: { rail: "Faster Payments", eta: "~2 sec", feePct: 0.15 },
  KES: { rail: "MPesa B2C", eta: "~42 ms", feePct: 0.4 },
  USDC: { rail: "Polygon Bridge", eta: "~5 sec", feePct: 0.05 },
  USD: { rail: "ACH Transfer", eta: "~1 day", feePct: 0.2 },
};

function decimalsFor(rate: number) {
  if (rate < 0.01) return 6;
  if (rate < 1) return 4;
  if (rate < 100) return 4;
  return 2;
}

function buildHistory(): Record<string, number[]> {
  const h: Record<string, number[]> = {};
  CODES.forEach((c) => {
    const arr: number[] = [];
    let v = usdPerUnit[c];
    for (let i = 0; i < 40; i++) {
      v = v * (1 + (Math.random() - 0.5) * 0.0016);
      arr.push(v);
    }
    arr[39] = usdPerUnit[c];
    h[c] = arr;
  });
  return h;
}

function sparkPath(series: number[], w: number, h: number) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = w / (series.length - 1);
  return series.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(h - 3 - ((v - min) / range) * (h - 6)).toFixed(2)}`).join(" ");
}

function CurrencySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 border border-[#EAE6DF] rounded-[14px] px-4 py-3 bg-white hover:border-[#B3AC9F] transition-all w-full"
      >
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-mono font-bold text-[10px] flex-shrink-0" style={{ backgroundColor: CURRENCIES[value].color }}>
          {value}
        </div>
        <div className="flex-1 text-left">
          <div className="text-[15px] font-semibold text-[#18140F]">{value}</div>
          <div className="text-[11px] text-[#8C8579]">{CURRENCIES[value].name}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#8C8579] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#EAE6DF] rounded-[14px] shadow-2xl z-20 overflow-hidden"
          >
            {CODES.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF9] transition-colors border-b border-[#F1EEE8] last:border-b-0"
              >
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-mono font-bold text-[10px] flex-shrink-0" style={{ backgroundColor: CURRENCIES[c].color }}>
                  {c}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[14px] font-semibold text-[#18140F]">{c}</div>
                  <div className="text-[11px] text-[#8C8579]">{CURRENCIES[c].name}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SmartTableModal({ isOpen, onClose }: SmartTableModalProps) {
  const [activeTab, setActiveTab] = useState<"rates" | "convert" | "charts">("rates");
  const [isMaximized, setIsMaximized] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [pinned, setPinned] = useState<Set<string>>(new Set(["USD/EUR"]));
  const [history, setHistory] = useState<Record<string, number[]>>(() => buildHistory());
  const [fxMeta, setFxMeta] = useState<{ source: string; date: string; live: boolean }>({ source: "", date: "", live: false });

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState("10000");

  const userBehavior = {
    topPairs: ["USD/EUR", "USD/KES", "EUR/GBP"],
    avgMonthlyVolume: 142000,
    preferredCurrency: "USD",
    behaviorInsight: "You convert USD → EUR 3x more than average users. Consider batching to save ~$240/mo.",
  };

  // Fetch real ECB mid-market rates + history when opened
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fx");
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.history) {
          setHistory(data.history);
          setFxMeta({ source: data.source, date: data.date, live: true });
        } else {
          setFxMeta({ source: "Simulated (offline)", date: "", live: false });
        }
      } catch {
        if (!cancelled) setFxMeta({ source: "Simulated (offline)", date: "", live: false });
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const pairSeries = (base: string, target: string) => history[base].map((v, i) => v / history[target][i]);
  const pctChange = (series: number[]) => ((series[series.length - 1] - series[0]) / series[0]) * 100;

  const rateRows = useMemo(() => {
    return CODES.filter((c) => c !== baseCurrency).map((c) => {
      const series = pairSeries(baseCurrency, c);
      const rate = series[series.length - 1];
      const change = pctChange(series);
      const min = Math.min(...series);
      const max = Math.max(...series);
      const pos = max > min ? ((rate - min) / (max - min)) * 100 : 50;
      return { code: c, name: CURRENCIES[c].name, color: CURRENCIES[c].color, pairKey: `${baseCurrency}/${c}`, rate, change, min, max, pos, decimals: decimalsFor(rate) };
    });
  }, [baseCurrency, history]);

  const togglePin = (pairKey: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(pairKey)) next.delete(pairKey); else next.add(pairKey);
      return next;
    });
  };

  const pinnedRows = useMemo(() => {
    return [...pinned].map((pairKey) => {
      const [b, t] = pairKey.split("/");
      const series = pairSeries(b, t);
      const rate = series[series.length - 1];
      return { pairKey, base: b, target: t, rate, decimals: decimalsFor(rate) };
    });
  }, [pinned, history]);

  const fromSeries = pairSeries(fromCurrency, toCurrency);
  const convertRate = fromSeries[fromSeries.length - 1];
  const convertDecimals = decimalsFor(convertRate);
  const parsedAmount = parseFloat(amount) || 0;
  const receive = parsedAmount * convertRate;
  const route = routeByCurrency[toCurrency] || routeByCurrency.USD;
  const savings = parsedAmount * (0.006 - route.feePct / 100);

  const handleConvert = () => {
    window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: `Convert ${parsedAmount.toLocaleString()} ${fromCurrency} to ${toCurrency}` }));
    onClose();
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  if (!isOpen) return null;
  const timestamp = new Date().toUTCString().slice(17, 25);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#18140F]/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`bg-white border border-[#EAE6DF] rounded-[22px] shadow-[0_40px_80px_rgba(24,20,15,0.25)] overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
            isMaximized ? "w-[95vw] max-w-none h-[95vh] max-h-none" : "w-full max-w-[760px] max-h-[88vh]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1EEE8] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] bg-[#FDEBE0] flex items-center justify-center">
                <Globe2 className="w-[18px] h-[18px] text-[#F1622C]" />
              </div>
              <div>
                <h2 className="font-sans text-[16.5px] font-semibold text-[#18140F] tracking-tight">FX Rates</h2>
                <p className="text-[12px] text-[#8C8579] mt-0.5">Mid-market · aggregated across 14 rails</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 ${fxMeta.live ? "bg-[#E7F5EC] border-[#BEE5CC]" : "bg-[#FBF1DA] border-[#EAD9B0]"}`}>
                <span className="relative w-1.5 h-1.5">
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-60 ${fxMeta.live ? "bg-[#17824A]" : "bg-[#9C6B08]"}`} />
                  <span className={`absolute inset-0 rounded-full ${fxMeta.live ? "bg-[#17824A]" : "bg-[#9C6B08]"}`} />
                </span>
                <span className={`text-[10px] font-bold tracking-widest ${fxMeta.live ? "text-[#17824A]" : "text-[#9C6B08]"}`}>
                  {fxMeta.live ? "ECB" : "SIM"}
                </span>
              </div>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-8 h-8 rounded-[9px] border border-[#EAE6DF] bg-white flex items-center justify-center text-[#8C8579] hover:text-[#18140F] hover:border-[#B3AC9F] transition-all"
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-[9px] border border-[#EAE6DF] bg-white flex items-center justify-center text-[#8C8579] hover:text-[#18140F] hover:border-[#B3AC9F] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab row */}
          <div className="flex gap-1 px-6 pt-3.5 border-b border-[#F1EEE8] flex-shrink-0">
            {(["rates", "convert", "charts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative text-[13px] font-semibold px-1 py-2.5 capitalize transition-colors ${activeTab === tab ? "text-[#18140F]" : "text-[#8C8579]"}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.span layoutId="tab-underline" className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-[#F1622C] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {activeTab === "rates" ? (
              <>
                {/* AI Personalization Card */}
                <div className="bg-[#0E1116] rounded-[16px] p-5 mb-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F1622C]/15 border border-[#F1622C]/30 flex items-center justify-center">
                      <BrainCircuit className="w-4 h-4 text-[#F1622C]" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">Your FX Pattern</h3>
                      <p className="text-[10.5px] text-[#8791B3] font-mono tracking-wider mt-0.5">AI-ANALYZED FROM YOUR TRANSACTION HISTORY</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-[10px] text-[#8791B3] uppercase tracking-wider mb-1">Top Pair</div>
                      <div className="font-mono text-[13px] font-semibold text-white">{userBehavior.topPairs[0]}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8791B3] uppercase tracking-wider mb-1">Monthly Vol.</div>
                      <div className="font-mono text-[13px] font-semibold text-white">${userBehavior.avgMonthlyVolume.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8791B3] uppercase tracking-wider mb-1">Preferred</div>
                      <div className="font-mono text-[13px] font-semibold text-white">{userBehavior.preferredCurrency}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#8791B3] uppercase tracking-wider mb-1">Status</div>
                      <div className="font-mono text-[13px] font-semibold text-[#4CC38A]">Optimal</div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-[#F1622C] mt-0.5 flex-shrink-0" />
                    <p className="text-[12px] text-[#A0AABF] leading-relaxed">{userBehavior.behaviorInsight}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                  <span className="text-[12px] text-[#8C8579] font-medium">Base currency</span>
                  <div className="flex gap-2 flex-wrap">
                    {CODES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setBaseCurrency(c)}
                        className={`flex items-center gap-1.5 text-[12.5px] font-semibold border rounded-full px-3 py-1.5 transition-all ${
                          c === baseCurrency ? "border-[#18140F] bg-[#18140F] text-white" : "border-[#EAE6DF] bg-white text-[#18140F] hover:border-[#B3AC9F]"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-[5px] text-[6.5px] font-mono font-bold text-white flex items-center justify-center" style={{ backgroundColor: CURRENCIES[c].color }}>{c[0]}</span>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {pinnedRows.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {pinnedRows.map((p) => (
                      <div key={p.pairKey} className="flex items-center gap-1.5 bg-[#FDEBE0] border border-[#F6C7AC] rounded-full px-2.5 py-1">
                        <span className="font-mono text-[11.5px] font-semibold text-[#C94A1D]">{p.base}/{p.target}</span>
                        <span className="font-mono text-[11.5px] text-[#4E4841]">{p.rate.toFixed(p.decimals)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-[#EAE6DF] rounded-[16px] overflow-hidden">
                  <div className="grid grid-cols-[1.6fr_1fr_0.8fr_32px] sm:grid-cols-[1.6fr_1fr_0.8fr_1.1fr_32px] px-4 py-2.5 bg-[#FAFAF9] border-b border-[#EAE6DF]">
                    <span className="text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-wider">Currency</span>
                    <span className="text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-wider">Rate</span>
                    <span className="text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-wider">Change</span>
                    <span className="text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-wider hidden sm:block">Period Range</span>
                    <span></span>
                  </div>

                  {rateRows.map((r) => (
                    <div key={r.code} className="grid grid-cols-[1.6fr_1fr_0.8fr_32px] sm:grid-cols-[1.6fr_1fr_0.8fr_1.1fr_32px] items-center px-4 py-3 border-b border-[#F1EEE8] last:border-b-0 hover:bg-[#FAFAF9] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white font-mono font-bold text-[9px] flex-shrink-0" style={{ backgroundColor: r.color }}>{r.code}</div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-[#18140F]">{baseCurrency} / {r.code}</div>
                          <div className="text-[11px] text-[#8C8579] mt-0.5 truncate">{r.name}</div>
                        </div>
                      </div>
                      <div className="font-mono text-[14px] font-semibold text-[#18140F] tabular-nums">{r.rate.toFixed(r.decimals)}</div>
                      <div>
                        <span className={`inline-flex items-center gap-0.5 font-mono text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${r.change >= 0 ? "bg-[#E7F5EC] text-[#17824A]" : "bg-[#FDECEC] text-[#B91C1C]"}`}>
                          {r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change).toFixed(2)}%
                        </span>
                      </div>
                      <div className="hidden sm:flex flex-col gap-1">
                        <div className="relative h-[3px] bg-[#EAE6DF] rounded-full">
                          <div className="absolute top-[-2.5px] w-[7px] h-[7px] rounded-full bg-[#4C5C88]" style={{ left: `${r.pos}%`, transform: "translateX(-50%)" }} />
                        </div>
                        <div className="flex justify-between font-mono text-[9px] text-[#B3AC9F]">
                          <span>{r.min.toFixed(r.decimals)}</span>
                          <span>{r.max.toFixed(r.decimals)}</span>
                        </div>
                      </div>
                      <button onClick={() => togglePin(r.pairKey)} className={`w-[26px] h-[26px] rounded-[8px] flex items-center justify-center transition-all ${pinned.has(r.pairKey) ? "text-[#F1622C] bg-[#FDEBE0]" : "text-[#B3AC9F] hover:text-[#F1622C] hover:bg-[#FDEBE0]"}`}>
                        <Bookmark className="w-[14px] h-[14px]" fill={pinned.has(r.pairKey) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-[#F1EEE8] flex-wrap">
                  <p className="text-[11.5px] text-[#8C8579] leading-relaxed max-w-[480px]">This table is your reference rate — check it before approving any AI-drafted payment. Pin the pairs you watch most.</p>
                  <span className="font-mono text-[11px] text-[#B3AC9F] whitespace-nowrap">as of {fxMeta.live ? fxMeta.date : timestamp}</span>
                </div>
              </>
            ) : activeTab === "convert" ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <CurrencySelector value={fromCurrency} onChange={setFromCurrency} />
                  <button onClick={handleSwap} title="Swap currencies" className="w-9 h-9 rounded-[11px] border border-[#EAE6DF] bg-white flex items-center justify-center text-[#8C8579] hover:text-[#18140F] hover:border-[#B3AC9F] transition-all hover:rotate-180">
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                  <CurrencySelector value={toCurrency} onChange={setToCurrency} />
                </div>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[11px] text-[#8C8579] font-medium">You send</label>
                    <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border-none outline-none font-mono text-[26px] font-semibold text-[#18140F] mt-1 bg-transparent" />
                  </div>
                  <div className="w-px h-10 bg-[#EAE6DF] hidden sm:block" />
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[11px] text-[#8C8579] font-medium">They receive ({toCurrency})</label>
                    <div className="font-mono text-[26px] font-semibold text-[#4C5C88] mt-1 tabular-nums">{receive.toLocaleString(undefined, { maximumFractionDigits: convertDecimals })}</div>
                  </div>
                </div>

                <div className="bg-[#0E1116] rounded-[14px] p-4 mb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[10px] bg-[#F1622C]/15 border border-[#F1622C]/30 flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4 text-[#F1622C]" />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold text-white">AI best route: {route.rail}</div>
                        <div className="flex gap-3 mt-1 font-mono text-[10.5px] text-[#8791B3]">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {route.eta}</span>
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {route.feePct}% fee</span>
                        </div>
                      </div>
                    </div>
                    {savings > 0 && (
                      <div className="font-mono text-[10.5px] text-[#4CC38A] bg-[#4CC38A]/10 border border-[#4CC38A]/25 rounded-full px-2.5 py-1">
                        saves {savings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fromCurrency} vs SWIFT
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handleConvert} className="w-full bg-[#F1622C] text-white border-none rounded-[12px] py-3.5 text-[13.5px] font-semibold flex items-center justify-center gap-2 hover:bg-[#C94A1D] transition-colors">
                  <BrainCircuit className="w-[14px] h-[14px]" /> Convert via AI
                </button>
              </>
            ) : (
              <>
                <div className="bg-[#FAFAF9] border border-[#EAE6DF] rounded-[14px] p-4">
                  <h3 className="text-[14px] font-semibold text-[#18140F] mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#F1622C]" /> Live Market Charts
                  </h3>
                  <p className="text-[12px] text-[#8C8579] mb-4">Real ECB price action for all currency pairs. Expands dynamically in full-screen mode.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {rateRows.map((r) => {
                      const series = pairSeries(baseCurrency, r.code);
                      return (
                        <div key={r.code} className="border border-[#EAE6DF] rounded-[12px] p-3 bg-white hover:border-[#B3AC9F] transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-[7px] flex items-center justify-center text-white font-mono font-bold text-[8px]" style={{ backgroundColor: r.color }}>{r.code}</div>
                              <span className="text-[12px] font-semibold text-[#18140F]">{baseCurrency}/{r.code}</span>
                            </div>
                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${r.change >= 0 ? "bg-[#E7F5EC] text-[#17824A]" : "bg-[#FDECEC] text-[#B91C1C]"}`}>
                              {r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change).toFixed(2)}%
                            </span>
                          </div>
                          <svg viewBox="0 0 200 60" className="w-full h-[60px]">
                            <path d={sparkPath(series, 200, 60)} fill="none" stroke={r.change >= 0 ? "#17824A" : "#E5484D"} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <div className="flex justify-between mt-2 text-[10px] text-[#8C8579] font-mono">
                            <span>{r.min.toFixed(r.decimals)}</span>
                            <span className="font-semibold text-[#18140F]">{r.rate.toFixed(r.decimals)}</span>
                            <span>{r.max.toFixed(r.decimals)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-3 bg-[#FAFAF9] border-t border-[#F1EEE8] text-center flex-shrink-0">
            <p className="text-[11px] text-[#8C8579]">{fxMeta.live ? `${fxMeta.source} · as of ${fxMeta.date}` : "Offline — simulated rates"} · routing scored by Wireways AI across 14 rails</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}