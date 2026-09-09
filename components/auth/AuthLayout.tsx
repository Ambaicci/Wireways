"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// The serious Wireways brand mark (radiating network node)
export function BrandMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

const baseRates = [
  { pair: "USD / KES", base: 129.45, decimals: 2 },
  { pair: "EUR / USD", base: 1.0892, decimals: 4 },
  { pair: "GBP / USD", base: 1.2704, decimals: 4 },
  { pair: "USD / USDC", base: 1.0001, decimals: 4 },
];

const routes = [
  { amount: "$12,400", route: "USD → KES · MPesa B2C" },
  { amount: "€3,250", route: "EUR → GBP · Local Rail" },
  { amount: "KSh 840,000", route: "KES → USDC · Crypto Rail" },
  { amount: "£9,800", route: "GBP → USD · Instant SWIFT" },
  { amount: "$56,000", route: "USDC → KES · MPesa B2C" },
];

const words = [
  { t: "The" }, { t: "financial" }, { t: "operating" }, { t: "system" }, { t: "for" },
  { t: "intelligent", accent: true }, { t: "money" }, { t: "movement." },
];

const wordVariant = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const [rates, setRates] = useState(baseRates.map((r) => ({ ...r, value: r.base, up: true, flash: false })));
  const [routeIndex, setRouteIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setRates((prev) =>
        prev.map((r) => {
          if (Math.random() > 0.4) return { ...r, flash: false };
          const delta = (Math.random() - 0.5) * 0.002 * r.base;
          return { ...r, value: r.base + delta, up: delta >= 0, flash: true };
        })
      );
    }, 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRouteIndex((i) => (i + 1) % routes.length), 3000);
    return () => clearInterval(t);
  }, []);

  const currentRoute = routes[routeIndex];

  return (
    <main className="min-h-screen flex bg-[#F6F5F3]">
      <style>{`
        @keyframes ww-drift-a { 0%,100% { transform: translate(0,0);} 50% { transform: translate(40px,30px);} }
        @keyframes ww-drift-b { 0%,100% { transform: translate(0,0);} 50% { transform: translate(-30px,-40px);} }
        @keyframes ww-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .ww-form-scroll::-webkit-scrollbar { width: 8px; }
        .ww-form-scroll::-webkit-scrollbar-track { background: transparent; }
        .ww-form-scroll::-webkit-scrollbar-thumb { background: #EAE6DF; border-radius: 999px; }
        .ww-form-scroll::-webkit-scrollbar-thumb:hover { background: #D6D0C6; }
      `}</style>

      {/* ===== Brand panel (left) — pinned, never scrolls ===== */}
       <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 flex-col justify-between w-[52%] shrink-0 bg-[#0E1116] relative overflow-hidden p-12">

        {/* Drifting ambient glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#F1622C]/15 rounded-full blur-[140px] pointer-events-none" style={{ animation: "ww-drift-a 12s ease-in-out infinite" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#4C5C88]/25 rounded-full blur-[120px] pointer-events-none" style={{ animation: "ww-drift-b 14s ease-in-out infinite" }} />
        {/* Fine grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Brand */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-[#F1622C] flex items-center justify-center shadow-lg shadow-[#F1622C]/20">
            <BrandMark className="w-5 h-5" />
            <span className="absolute inset-0 rounded-xl border border-[#F1622C]/70" style={{ animation: "ww-pulse 2.4s ease-in-out infinite" }} />
          </div>
          <span className="text-white text-[18px] font-semibold tracking-tight">Wireways</span>
        </motion.div>

        {/* Headline + live feed */}
        <div className="relative max-w-[560px]">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            className="text-white text-[42px] leading-[1.08] font-semibold tracking-tight"
          >
            {words.map((w, i) => (
              <motion.span key={i} variants={wordVariant} className={`inline-block mr-[0.26em] ${w.accent ? "text-[#F1622C]" : ""}`}>
                {w.t}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="text-[#8791B3] mt-5 text-[15px] leading-relaxed max-w-[480px]">
            Hold, convert, and route funds across borders and currencies — guided by an AI copilot that never sleeps.
          </motion.p>

          {/* Live settlement feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 w-fit overflow-hidden"
          >
            <span className="relative flex w-2 h-2 shrink-0">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#4CC38A] opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-[#4CC38A]" />
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={routeIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-baseline gap-2 whitespace-nowrap"
              >
                <span className="text-white font-mono text-[13px]">{currentRoute.amount}</span>
                <span className="text-[#8791B3] text-[12px]">{currentRoute.route}</span>
                <span className="text-[#4CC38A] text-[11px] font-mono">settled ✓</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Live FX ticker */}
        <div className="relative grid grid-cols-4 gap-3">
          {rates.map((r, i) => (
            <motion.div
              key={r.pair}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="text-[10px] font-mono text-[#8791B3] tracking-wider">{r.pair}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`font-mono text-[15px] transition-colors duration-500 ${r.flash ? (r.up ? "text-[#4CC38A]" : "text-[#E5484D]") : "text-white"}`}>
                  {r.value.toFixed(r.decimals)}
                </span>
                <span className={`text-[10px] font-mono ${r.up ? "text-[#4CC38A]" : "text-[#E5484D]"}`}>{r.up ? "▲" : "▼"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== Form panel (right) — the sole scrollable column ===== */}
        <div className="flex-1 min-h-screen ww-form-scroll lg:ml-[52%]">

        <div className="relative flex flex-col justify-center px-6 py-14 sm:px-16 lg:px-24 min-h-screen">
          <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-[#F1622C]/8 rounded-full blur-[100px] pointer-events-none" />

          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#F1622C] flex items-center justify-center">
              <BrandMark className="w-4 h-4" />
            </div>
            <span className="text-[#18140F] text-[17px] font-semibold tracking-tight">Wireways</span>
          </div>

          <div className="max-w-[420px] w-full mx-auto relative">
            <h2 className="text-[28px] font-semibold text-[#18140F] tracking-tight">{title}</h2>
            <p className="text-[14px] text-[#8C8579] mt-1.5">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
