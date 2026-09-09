"use client";

import { motion } from "framer-motion";
import { 
  Activity, Zap, TrendingUp, AlertTriangle, CheckCircle2, Brain, Sparkles 
} from "lucide-react";
import { formatCompactUsd } from "@/lib/constants";
import WicIcon from "@/components/ui/WicIcon";
import type { Briefing } from "@/wic/intelligence";

export default function WicIntelligenceClient({ briefing }: { briefing: Briefing }) {
  return (
    <div className="min-h-screen bg-[#F6F5F3] text-[#1D1D1F] p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto">

        {/* ─── Header ─── */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1622C]/10 flex items-center justify-center border border-[#F1622C]/20 shadow-sm">
              <WicIcon className="w-6 h-6 text-[#F1622C]" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[32px] font-bold tracking-[-0.03em] text-[#1D1D1F]">
                {briefing.greeting}
              </h1>
              <p className="text-[15px] text-[#86868B] font-medium mt-1">{briefing.headline}</p>
            </div>
          </div>
        </header>

        {/* ─── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Treasury & Memory */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Treasury & Liquidity */}
            <div className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[17px] font-bold text-[#1D1D1F] flex items-center gap-2 tracking-tight">
                  <Activity className="w-4 h-4 text-[#F1622C]" /> Treasury & Liquidity
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  briefing.confidence.score >= 70
                    ? "text-[#287A55] bg-[#E7F2EC] border-[#287A55]/20"
                    : "text-[#DC2626] bg-[#FEE2E2] border-[#DC2626]/20"
                }`}>
                  {briefing.confidence.label}
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA]">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">Position Summary</p>
                  <p className="text-[15px] font-semibold text-[#1D1D1F] leading-relaxed">{briefing.positionSummary}</p>
                  {briefing.confidence.factors.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {briefing.confidence.factors.map((factor, i) => (
                        <li key={i} className="text-[13px] text-[#4B5563] flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#287A55] mt-0.5 shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA]">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Liquidity Runway</p>
                    <p className="text-[28px] font-bold text-[#1D1D1F] tracking-tight tabular-nums">
                      {briefing.money.liquidityDays} <span className="text-[14px] font-semibold text-[#86868B]">days</span>
                    </p>
                    <p className="text-[12px] text-[#86868B] mt-1 font-medium">{briefing.money.liquiditySentence}</p>
                  </div>
                  <div className="p-5 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA]">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Total Net Worth</p>
                    <p className="text-[28px] font-bold text-[#1D1D1F] tracking-tight tabular-nums">
                      {formatCompactUsd(briefing.money.totalUsd)}
                    </p>
                    <p className="text-[12px] text-[#86868B] mt-1 font-medium">Across {briefing.money.breakdown.length} active wallets</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WIC Memory & Patterns (NEW) */}
            <div className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h2 className="text-[17px] font-bold text-[#1D1D1F] flex items-center gap-2 mb-6 tracking-tight">
                <Brain className="w-4 h-4 text-[#F1622C]" /> WIC Memory & Patterns
              </h2>
              {briefing.memory.line ? (
                <div className="p-5 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA] flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F1622C]/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#F1622C]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1D1D1F] leading-relaxed">{briefing.memory.line}</p>
                    <p className="text-[12px] text-[#86868B] mt-2">WIC continuously analyzes your transaction history to anticipate your needs.</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-[#F5F5F7] rounded-[16px] border border-[#E5E5EA] text-center">
                  <Brain className="w-8 h-8 text-[#D1D1D6] mx-auto mb-3" />
                  <p className="text-[14px] font-medium text-[#86868B]">WIC is observing your transactions.</p>
                  <p className="text-[12px] text-[#A1A1AA] mt-1">As your history grows, WIC will learn your financial rhythm and surface patterns here.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Missions */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h2 className="text-[17px] font-bold text-[#1D1D1F] flex items-center gap-2 mb-6 tracking-tight">
                <Zap className="w-4 h-4 text-[#F1622C]" /> Active Missions
              </h2>
              <div className="space-y-3">
                {briefing.missions.length === 0 ? (
                  <div className="p-6 bg-[#F5F5F7] border border-[#E5E5EA] rounded-[16px] text-center">
                    <p className="text-[13px] font-medium text-[#86868B]">No active missions. Your treasury is optimized.</p>
                  </div>
                ) : (
                  briefing.missions.map((mission) => (
                    <div key={mission.id} className={`p-4 rounded-[16px] border transition-all hover:shadow-sm ${
                      mission.status === "attention" ? "bg-[#FEF2F2] border-[#FCA5A5]" :
                      mission.status === "opportunity" ? "bg-[#FFF7ED] border-[#FDBA74]" :
                      "bg-[#F5F5F7] border-[#E5E5EA]"
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-[#1D1D1F] leading-snug">{mission.title}</p>
                        {mission.status === "attention" && <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />}
                        {mission.status === "opportunity" && <TrendingUp className="w-4 h-4 text-[#F1622C] shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[12px] text-[#4B5563] mt-2 leading-relaxed">{mission.detail}</p>
                      {mission.explain.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {mission.explain.slice(0, 2).map((exp, i) => (
                            <li key={i} className="text-[11px] text-[#6B7280] flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#9CA3AF] mt-1.5 shrink-0" />
                              {exp}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}