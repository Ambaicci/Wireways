"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, Lightbulb, Eye, EyeOff, X,
  Send, Download, Repeat, Plus, SlidersHorizontal, CalendarClock,
  ArrowDownLeft, ArrowUpRight, TrendingUp, Activity, ChevronRight
} from "lucide-react";
import SmartTableModal from "./SmartTableModal";
import SendMoneyModal from "./SendMoneyModal";
import ConvertCurrencyModal from "./ConvertModal";
import AddFundsModal from "./AddFundsModal";
import CreateLinkModal from "./CreateLinkModal";
import { formatCurrency } from "@/lib/constants";

// ─── Design Tokens ────────────────────────────────────────
const T = {
  dark: "#1C1917",
  darkSoft: "#292524",
  brand: "#F1622C",
  brandDark: "#D4511E",
  brandSoft: "#FDEBE0",
  brandWash: "rgba(241,98,44,0.06)",
  blue: "#4C5C88",
  blue2: "#8791B3",
  blueSoft: "#EAEDF3",
  blueWash: "rgba(76,92,136,0.055)",
  green: "#287A55",
  greenSoft: "#E7F2EC",
  greenWash: "rgba(40,122,85,0.06)",
  amber: "#9C6B08",
  red: "#C53030",
  ink: "#1C1917",
  inkSoft: "#57534E",
  muted: "#A8A29E",
  faint: "#D6D3D1",
  border: "#E7E5E4",
  borderSoft: "#F5F5F4",
  paper: "#F6F5F3",
};

// ── Sparkline Path Generator ──────────────────────────────
function sparkPath(points: number[], w: number, h: number) {
  if (!points || points.length === 0) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = (max - min) || 1;
  const step = w / (points.length - 1);
  return points.map((p, i) => {
    const x = (i * step).toFixed(1);
    const y = (h - 2 - ((p - min) / range) * (h - 4)).toFixed(1);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
}

export default function WicDashboard({ briefing, recent, wallets, accountType = "personal", company }: {
  briefing: any;
  recent: any[];
  wallets: any[];
  accountType?: "personal" | "business";
  company?: string;
}) {
  const router = useRouter();

  // ─── State ───────────────────────────────────────────────
  const [explain, setExplain] = useState<{ title: string; factors: { t: string; ok: boolean }[] } | null>(null);
  const [isPrivacyOn, setIsPrivacyOn] = useState(false);
  const [isSmartTableOpen, setIsSmartTableOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  
  const [briefIndex, setBriefIndex] = useState(0);
  const [briefAnimating, setBriefAnimating] = useState(false);
  const briefTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Dynamic Data Mapping (Safe Fallbacks) ──────────────
  const rawMissions = briefing?.missions || [];
  const briefItems = rawMissions.length > 0 ? rawMissions.slice(0, 3).map((m: any) => ({
    status: m.status,
    icon: m.status === "attention" ? AlertTriangle : m.status === "opportunity" ? Lightbulb : CheckCircle2,
    text: m.title,
    factors: m.explain.map((t: string) => ({ 
      t, 
      ok: !t.toLowerCase().includes("short") && !t.toLowerCase().includes("gap") && !t.toLowerCase().includes("risk") && !t.toLowerCase().includes("empty")
    })),
    actionLabel: m.actionLabel,
    actionPayload: m.action?.payload || "",
  })) : [
    {
      status: "good" as const,
      icon: CheckCircle2,
      text: "Your treasury is fully optimized.",
      factors: [{ t: "No funding gaps or upcoming risks detected.", ok: true }],
      actionLabel: "",
      actionPayload: "",
    }
  ];

  const totalUsd = briefing?.money?.totalUsd || 0;
  const confidenceScore = briefing?.confidence?.score || 0;
  const breakdown = (briefing?.money?.breakdown || []).slice(0, 5);
  const upcoming = (briefing?.upcoming || []).slice(0, 2);
  const watching = briefing?.watching || [];
  const fxRates = briefing?.fx?.usdRates || { EUR: 0.92, GBP: 0.79, KES: 130 };

  // ─── Briefing Cycle Logic ───────────────────────────────
  useEffect(() => {
    startBriefCycle();
    return () => stopBriefCycle();
  }, [briefItems.length]);

  const startBriefCycle = () => {
    stopBriefCycle();
    briefTimerRef.current = setInterval(() => {
      cycleBrief();
    }, 4500);
  };

  const stopBriefCycle = () => {
    if (briefTimerRef.current) clearInterval(briefTimerRef.current);
  };

  const cycleBrief = () => {
    setBriefAnimating(true);
    setTimeout(() => {
      setBriefIndex((prev) => (prev + 1) % briefItems.length);
      setBriefAnimating(false);
    }, 160);
  };

  const jumpBrief = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    if (i === briefIndex) return;
    stopBriefCycle();
    setBriefAnimating(true);
    setTimeout(() => {
      setBriefIndex(i);
      setBriefAnimating(false);
      startBriefCycle();
    }, 160);
  };

  const handleBriefClick = () => {
    const item = briefItems[briefIndex];
    setExplain({ title: item.text, factors: item.factors });
  };

  // ─── Helpers ────────────────────────────────────────────
  function prefillDock(text: string) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F5F3] pb-36">
      <main className="max-w-[1120px] mx-auto px-6 pt-0 pb-7 space-y-5">

               {/* ════════════════════════════════════════════════════
            HERO / BRIEFER — Light, Premium, Integrated
            ════════════════════════════════════════════════════ */}
        <section className="bg-white border border-[#D1D1D6] rounded-[24px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mt-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left: Greeting & Briefing */}
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-[8px] h-[8px]">
                  <motion.span
                    animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-[#F1622C]"
                  />
                  <span className="absolute inset-0 rounded-full bg-[#F1622C]" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#86868B]">WIC Active</span>
              </div>

              <h1 className="text-[clamp(28px,3.5vw,36px)] leading-[1.1] tracking-[-0.03em] font-bold text-[#1D1D1F] mb-2">
                {briefing?.greeting || "Good afternoon."}
              </h1>
              <p className="text-[15px] font-medium text-[#86868B]">{briefing?.headline || "Here is what matters today."}</p>

              <div 
                className="mt-5 inline-flex flex-col cursor-pointer select-none"
                onMouseEnter={stopBriefCycle}
                onMouseLeave={startBriefCycle}
                onClick={handleBriefClick}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={briefIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: briefAnimating ? 0.16 : 0.32 }}
                    className="relative h-[44px] rounded-[14px] px-4 flex items-center gap-2.5 overflow-hidden transition-all duration-150 hover:shadow-sm active:scale-[0.98] bg-[#F5F5F7] border border-[#E5E5EA]"
                  >
                    {(() => {
                      const Icon = briefItems[briefIndex].icon;
                      return <Icon className="w-4 h-4 flex-shrink-0 text-[#1D1D1F]" strokeWidth={2.2} />;
                    })()}
                    
                    <span className="text-[13px] font-semibold text-[#1D1D1F] whitespace-nowrap overflow-hidden text-ellipsis">
                      {briefItems[briefIndex].text}
                    </span>
                    <ChevronRight className="w-[13px] h-[13px] ml-auto flex-shrink-0 text-[#86868B]" />
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-2 mt-2.5 px-0.5">
                  <div className="flex-1 h-[3px] rounded-[3px] overflow-hidden bg-[#E5E5EA]">
                    <motion.div
                      key={briefIndex}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4.5, ease: "linear" }}
                      className="h-full rounded-[3px] bg-[#1D1D1F]"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {briefItems.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => jumpBrief(e, i)}
                        className="h-[5px] border-none cursor-pointer transition-all duration-200 bg-[#E5E5EA]"
                        style={{
                          backgroundColor: i === briefIndex ? "#1D1D1F" : "#E5E5EA",
                          width: i === briefIndex ? "12px" : "5px",
                          borderRadius: i === briefIndex ? "3px" : "50%",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Pulse (Confidence Score) */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => setExplain({
                title: `Financial confidence — ${confidenceScore}/100`,
                factors: (briefing?.confidence?.factors || ["Calibrating..."]).map((t: string) => ({ 
                  t, 
                  ok: !t.toLowerCase().includes("gap") && !t.toLowerCase().includes("empty") && !t.toLowerCase().includes("risk")
                }))
              })}
              className="flex-shrink-0 w-[200px] bg-[#F5F5F7] border border-[#E5E5EA] rounded-[20px] p-5 cursor-pointer hover:shadow-sm transition-all"
            >
              <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#86868B] block mb-2">Live Pulse</span>
              <div className="flex items-baseline gap-1">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                  className="text-[32px] font-bold tracking-[-0.04em] text-[#1D1D1F] transition-colors duration-150"
                >
                  {confidenceScore}
                </motion.span>
                <span className="text-[12px] font-semibold text-[#86868B]">/100</span>
              </div>
              <p className="text-[12px] mt-1 font-medium text-[#86868B]">{briefing?.confidence?.label || "Calibrating"}</p>
            </motion.div>
          </div>
        </section>
       
        {/* ════════════════════════════════════════════════════
            MISSIONS — Fully Clickable Cards
            ════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[17px] leading-[1.25] tracking-[-0.025em] font-[600] text-[#1C1917]">
                {briefItems.filter(m => m.status !== "good").length > 0 ? "2 more things" : "You're on track"}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>Prioritized by urgency.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {briefItems.map((item, i) => {
              const isSolid = item.status !== "good";
              return (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  // CRITICAL: Entire card is now clickable to open the in-depth explanation
                  className="rounded-[16px] p-4 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.08)] cursor-pointer"
                  style={{
                    backgroundColor: isSolid ? (item.status === "attention" ? T.brand : T.blue) : T.greenWash,
                    border: item.status === "good" ? `1px solid rgba(40,122,85,0.14)` : "none",
                  }}
                  onClick={() => setExplain({ title: item.text, factors: item.factors })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[9.5px] uppercase tracking-[0.14em] font-[700] px-2 py-1 rounded-[6px]"
                      style={{
                        backgroundColor: isSolid ? "rgba(255,255,255,0.22)" : "rgba(40,122,85,0.12)",
                        color: isSolid ? "#fff" : T.green,
                      }}
                    >
                      {item.status === "attention" ? "Action" : item.status === "opportunity" ? "Opportunity" : "On track"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent double-triggering
                        setExplain({ title: item.text, factors: item.factors });
                      }}
                      className="w-5 h-5 rounded-[6px] border-none bg-none cursor-pointer flex items-center justify-center transition-colors"
                      style={{ color: isSolid ? "rgba(255,255,255,0.6)" : T.muted }}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                  <h3 className={`text-[13px] font-[600] leading-[1.35] ${isSolid ? "text-white" : "text-[#1C1917]"}`}>
                    {item.text}
                  </h3>
                  {item.factors[1] && (
                    <p className={`text-[11px] mt-1 ${isSolid ? "text-white/[0.8]" : "text-[#A8A29E]"}`}>
                      {item.factors[1].t}
                    </p>
                  )}
                  {item.actionLabel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent double-triggering
                        prefillDock(item.actionPayload);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1 bg-none border-none cursor-pointer font-[700] text-[11px]"
                      style={{ color: isSolid ? "#fff" : (item.status === "opportunity" ? T.blue : T.brand) }}
                    >
                      {item.actionLabel} →
                    </button>
                  )}
                </motion.article>
              );
            })}
          </div>
        </section>

               {/* ════════════════════════════════════════════════════
            MONEY CARD — Premium, Clean, Integrated
            ════════════════════════════════════════════════════ */}
        <section className="bg-white border border-[#D1D1D6] rounded-[24px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative">
          <div className="flex justify-between items-start gap-5 flex-wrap mb-6">
            <div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#86868B]">Total balance</span>
                <button
                  onClick={() => setIsPrivacyOn(!isPrivacyOn)}
                  className={`w-[24px] h-[24px] rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isPrivacyOn ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA]"
                  }`}
                >
                  {isPrivacyOn ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-[clamp(30px,4vw,40px)] leading-[1.05] tracking-[-0.03em] font-bold text-[#1D1D1F] tabular-nums mt-1">
                {isPrivacyOn ? "••••••" : formatCurrency(totalUsd, "USD")}
              </div>
              <p className="text-[12px] mt-1 font-medium text-[#86868B]">
                {isPrivacyOn ? "Balances hidden" : (briefing?.money?.liquiditySentence || "Across your active wallets")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 mt-6 border-t border-[#E5E5EA]">
            {breakdown.map((w: any, idx: number) => (
              <motion.div
                key={w.currency}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] font-bold mb-1.5 text-[#86868B]">
                  <span>{w.currency}</span>
                  {!isPrivacyOn && <span>{w.sharePct}%</span>}
                </div>
                <div className="text-[14px] font-semibold text-[#1D1D1F] tabular-nums">
                  {isPrivacyOn ? "••••" : formatCurrency(w.balance, w.currency)}
                </div>
                <div className="h-[4px] bg-[#F5F5F7] rounded-full mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isPrivacyOn ? "0%" : `${w.sharePct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-[#1D1D1F]"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

               {/* ═══════════════════════════════════════════════════
            INTELLIGENCE + FX PULSE — Premium, Clean, Integrated
            ════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-[17px] leading-[1.25] tracking-[-0.025em] font-bold text-[#1D1D1F]">Intelligence</h2>
              <p className="text-[12px] mt-0.5 font-medium text-[#86868B]">Derived from your real data and live markets.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[#86868B]">
              <Activity className="w-3 h-3 text-[#287A55]" />
              <span className="text-[10px] uppercase tracking-[0.12em] font-bold">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Insights Column */}
            <div className="flex flex-col gap-4">
              {watching.length > 0 ? watching.slice(0, 2).map((w: any, i: number) => (
                <div 
                  key={w.id} 
                  className="bg-white border border-[#D1D1D6] rounded-[24px] p-5 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setExplain({ title: w.title, factors: [{ t: w.detail, ok: w.category !== "action" }] })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${w.category === "fx" ? "bg-[#4C5C88]" : "bg-[#F1622C]"}`} />
                    <span className={`text-[10px] uppercase tracking-[0.12em] font-bold ${w.category === "fx" ? "text-[#4C5C88]" : "text-[#F1622C]"}`}>
                      {w.category === "fx" ? "FX Signal" : "Action"}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-1">{w.title}</h3>
                  <p className="text-[12px] font-medium text-[#86868B] leading-relaxed">{w.detail}</p>
                  {w.actionLabel && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        prefillDock(w.action?.payload || "");
                      }} 
                      className="mt-3 bg-none border-none cursor-pointer font-bold text-[12px] text-[#0071E3] hover:underline"
                    >
                      {w.actionLabel} →
                    </button>
                  )}
                </div>
              )) : (
                <div className="bg-white border border-[#D1D1D6] rounded-[24px] p-6 text-center flex items-center justify-center h-full">
                  <p className="text-[13px] font-medium text-[#86868B]">No active signals. Your treasury is optimized.</p>
                </div>
              )}
            </div>

            {/* FX Pulse Card */}
            <div 
              className="bg-white border border-[#D1D1D6] rounded-[24px] p-6 cursor-pointer hover:shadow-md transition-all" 
              onClick={() => setIsSmartTableOpen(true)}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4C5C88]" />
                  <span className="text-[14px] font-bold text-[#1D1D1F]">Live FX Rates</span>
                </div>
                <span className="text-[11px] font-semibold text-[#86868B]">Per 1 USD</span>
              </div>

              <div className="bg-[#F5F5F7] rounded-[16px] p-4 mb-4 border border-[#E5E5EA]">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#86868B] mb-1">
                  <TrendingUp className="w-3 h-3 text-[#287A55]" />
                  Mid-market rates, updated continuously
                </div>
                <div className="text-[11px] font-medium text-[#86868B]">Click to view the full FX reference table.</div>
              </div>

              <div className="space-y-2">
                {["EUR", "GBP", "KES"].map((code) => {
                  const rate = fxRates[code] || 1;
                  return (
                    <div key={code} className="flex items-center justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-[28px] h-[28px] rounded-full bg-[#F5F5F7] flex items-center justify-center font-bold text-[#1D1D1F] text-[10px] border border-[#E5E5EA]">
                          {code.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#1D1D1F] tabular-nums">{rate.toFixed(4)}</div>
                          <div className="text-[10px] font-semibold text-[#86868B]">1 USD = {rate.toFixed(4)} {code}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-5">
                <button 
                  onClick={(e) => { e.stopPropagation(); prefillDock("Convert USD to EUR"); }} 
                  className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold cursor-pointer border-none bg-[#1D1D1F] text-white hover:bg-black transition-colors"
                >
                  Convert
                </button>
                <button className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold cursor-pointer border border-[#D1D1D6] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors">
                  All rates
                </button>
              </div>
            </div>
          </div>
        </section>

               {/* ════════════════════════════════════════════════════
            LOWER GRID — Coming Up + Recent (Premium, Clean)
            ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Coming Up — Navigates to Wire-Roll */}
          <section 
            className="bg-white border border-[#D1D1D6] rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-pointer hover:shadow-md transition-all active:scale-[0.99]" 
            onClick={() => router.push("/wire-roll")}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F1622C]/10 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-[#F1622C]" />
                </div>
                <span className="text-[15px] font-bold text-[#1D1D1F] tracking-tight">Coming up</span>
              </div>
              <span className="text-[12px] font-semibold text-[#0071E3]">View Schedule →</span>
            </div>
            
            <div className="space-y-0">
              {upcoming.length > 0 ? upcoming.map((item: any, i: number) => (
                <div key={item.id} className={`flex items-center justify-between py-3.5 ${i > 0 ? "border-t border-[#E5E5EA]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 border border-[#E5E5EA]">
                      <span className="text-[11px] font-bold text-[#1D1D1F]">{item.daysUntilRun}d</span>
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1D1D1F]">{item.name}</div>
                      <div className="text-[11px] font-medium text-[#86868B] mt-0.5">{item.currency} · {item.dateLabel}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#1D1D1F] tabular-nums">{item.amountLabel}</div>
                    <div className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${item.funded ? "text-[#287A55]" : "text-[#DC2626]"}`}>
                      {item.funded ? "Funded" : (item.gapLabel || "Unfunded")}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <p className="text-[13px] font-medium text-[#86868B]">No upcoming scheduled payments.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent — Navigates to Payments */}
          <section 
            className="bg-white border border-[#D1D1D6] rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
            onClick={() => router.push("/payments")}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[15px] font-bold text-[#1D1D1F] tracking-tight">Recent</span>
              <span className="text-[12px] font-semibold text-[#0071E3]">View All →</span>
            </div>
            
            <div className="space-y-0">
              {recent && recent.length > 0 ? recent.map((t: any, i: number) => {
                const isIn = t.type === "in";
                return (
                  <div key={t.id || i} className={`flex items-center justify-between py-3.5 ${i > 0 ? "border-t border-[#E5E5EA]" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${isIn ? "bg-[#E7F2EC] border-[#287A55]/20" : "bg-[#F5F5F7] border-[#E5E5EA]"}`}>
                        {isIn ? (
                          <ArrowDownLeft className="w-4 h-4 text-[#287A55]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-[#86868B]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1D1D1F]">{t.name || "Unknown"}</div>
                        <div className="text-[11px] font-medium text-[#86868B] mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`text-[13px] font-bold tabular-nums ${isIn ? "text-[#287A55]" : "text-[#1D1D1F]"}`}>
                      {isIn ? "+" : "−"}{formatCurrency(t.amount, t.currency)}
                    </span>
                  </div>
                );
              }) : (
                <div className="py-6 text-center">
                  <p className="text-[13px] font-medium text-[#86868B]">No recent transactions.</p>
                </div>
              )}
            </div>
          </section>
        </div>
        {/* ════════════════════════════════════════════════════
            MODALS
            ════════════════════════════════════════════════════ */}
        <SmartTableModal isOpen={isSmartTableOpen} onClose={() => setIsSmartTableOpen(false)} />
        <AnimatePresence>
          {isSendOpen && <SendMoneyModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} wallets={wallets} />}
          {isConvertOpen && <ConvertCurrencyModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} />}
          {isTopUpOpen && <AddFundsModal currency="USD" isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />}
          {isRequestOpen && <CreateLinkModal onClose={() => setIsRequestOpen(false)} />}
        </AnimatePresence>

        {/* Explain Modal */}
        <AnimatePresence>
          {explain && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-5"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}
              onClick={() => setExplain(null)}
            >
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-[24px] p-6 w-full max-w-[480px] shadow-[0_32px_80px_rgba(0,0,0,0.2)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-3.5">
                  <h3 className="text-[17px] leading-[1.25] tracking-[-0.025em] font-[600] text-[#1C1917]">{explain.title}</h3>
                  <button
                    onClick={() => setExplain(null)}
                    className="w-7 h-7 rounded-[8px] border-none bg-[#F5F5F4] cursor-pointer flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {explain.factors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-[12px] border"
                      style={{
                        backgroundColor: "#FDFCFB",
                        borderColor: "#F0EBE5",
                      }}
                    >
                      {f.ok ? (
                        <CheckCircle2 className="w-3.25 h-3.25 mt-0.25 flex-shrink-0" style={{ color: T.green }} />
                      ) : (
                        <AlertTriangle className="w-3.25 h-3.25 mt-0.25 flex-shrink-0" style={{ color: T.brand }} />
                      )}
                      <span className="text-[11px] leading-[1.5] tracking-[0.01em] text-[#1C1917]">{f.t}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setExplain(null)}
                  className="mt-1.5 w-full py-3.25 rounded-[12px] text-white text-[13px] font-[600] cursor-pointer border-none transition-colors"
                  style={{ backgroundColor: T.dark }}
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}