"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, Zap, Activity, TrendingUp, AlertTriangle, CheckCircle2, 
  Shield, Terminal, Clock, Copy, Check, BookOpen, ArrowRight,
  Cpu, Network, Lock, Sparkles, Globe
} from "lucide-react";
import ApiKeys from "@/components/dashboard/settings/ApiKeys";
import { formatCompactUsd } from "@/lib/constants";
import WicIcon from "@/components/ui/WicIcon";
import type { Briefing } from "@/wic/intelligence";

type TabId = "intelligence" | "developer";

// Added defaultTab prop to handle sidebar routing
export default function WICPlatformClient({ briefing, defaultTab = "intelligence" }: { briefing: Briefing; defaultTab?: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`curl https://api.wireways.com/v1/chat/completions \\
  -H "Authorization: Bearer sk_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "wic-native-v1",
    "messages": [{"role": "user", "content": "Analyze my liquidity runway"}]
  }'`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const scrollToKeys = () => {
    document.getElementById('openwic-keys-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F6F5F3] text-[#1D1D1F] p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto">

        {/* ─── Dynamic Header ─── */}
        <header className="mb-8">
          {activeTab === "intelligence" ? (
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
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0F172A] flex items-center justify-center border border-[#E5E5EA] shadow-sm">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-[28px] md:text-[32px] font-bold tracking-[-0.03em] text-[#1D1D1F]">
                  OpenWIC Gateway
                </h1>
                <p className="text-[15px] text-[#86868B] font-medium mt-1">
                  The unified AI infrastructure for financial applications.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ─── Tab Navigation (iOS Segmented Control) ─── */}
        <div className="bg-[#E5E5EA] p-1 rounded-[14px] flex relative w-fit mb-8 border border-[#D1D1D6]">
          <motion.div
            layoutId="activeTabBg"
            className="absolute top-1 bottom-1 bg-white rounded-[10px] shadow-sm border border-[#E5E5EA]"
            style={{ 
              left: activeTab === "intelligence" ? "4px" : "calc(50% + 2px)", 
              width: "calc(50% - 6px)" 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setActiveTab("intelligence")}
            className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-bold transition-colors ${
              activeTab === "intelligence" ? "text-[#1D1D1F]" : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <WicIcon className="w-4 h-4" />
            WIC Intelligence
          </button>
          <button
            onClick={() => setActiveTab("developer")}
            className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-bold transition-colors ${
              activeTab === "developer" ? "text-[#1D1D1F]" : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <Code2 className="w-4 h-4" />
            OpenWIC Gateway
          </button>
        </div>

        {/* ── Tab Content ─── */}
        <AnimatePresence mode="wait">
          {activeTab === "intelligence" ? (
            <motion.div
              key="intelligence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Treasury & Liquidity Card */}
              <div className="lg:col-span-2 bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
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

              {/* AI Missions Card */}
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
            </motion.div>
          ) : (
            <motion.div
              key="developer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              {/* ── HERO SECTION ─── */}
              <section className="text-center py-8 md:py-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F172A]/5 border border-[#0F172A]/10 text-[#0F172A] text-[11px] font-bold uppercase tracking-wider mb-6">
                  <Sparkles className="w-3 h-3" /> Now in Public Beta
                </div>
                <h2 className="text-[40px] md:text-[56px] font-bold tracking-[-0.04em] text-[#1D1D1F] leading-[1.1] mb-4">
                  One API. Every AI Model.<br />
                  <span className="text-[#F1622C]">Zero Complexity.</span>
                </h2>
                <p className="text-[16px] md:text-[18px] text-[#86868B] max-w-2xl mx-auto leading-relaxed mb-8">
                  Access, compare, and route between 500+ AI models through a single Wireways credential. 
                  Better pricing, better uptime, and fully OpenAI-compatible.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={scrollToKeys}
                    className="px-6 py-3 rounded-[12px] bg-[#F1622C] text-white text-[14px] font-bold hover:bg-[#D4511E] transition-all shadow-[0_4px_14px_rgba(241,98,44,0.3)] flex items-center gap-2"
                  >
                    Get API Key <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="px-6 py-3 rounded-[12px] bg-white border border-[#E5E5EA] text-[#1D1D1F] text-[14px] font-bold hover:bg-[#F5F5F7] transition-all flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Read the Docs
                  </button>
                </div>
              </section>

              {/* ─── SCALE METRICS ─── */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-[#E5E5EA] py-8">
                {[
                  { val: "500+", label: "AI Models" },
                  { val: "99.9%", label: "Uptime SLA" },
                  { val: "45ms", label: "Avg Latency" },
                  { val: "100+", label: "Providers" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-[32px] md:text-[40px] font-bold text-[#1D1D1F] tracking-tight tabular-nums">{stat.val}</div>
                    <div className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </section>

              {/* ─── FEATURE GRID ─── */}
              <section className="grid md:grid-cols-2 gap-6">
                {[
                  { 
                    icon: Globe, title: "Unified Interface", 
                    desc: "Generate text, images, and audio through a single endpoint. All major models in one place.", 
                    color: "bg-[#E0F2FE] text-[#0284C7]" 
                  },
                  { 
                    icon: Network, title: "Smart Routing", 
                    desc: "Reliable AI via distributed infrastructure. Automatic fallbacks when a provider goes down.", 
                    color: "bg-[#F1F5F9] text-[#475569]" 
                  },
                  { 
                    icon: Cpu, title: "Financial Context", 
                    desc: "Our native WIC models are pre-trained on financial data, giving you domain-specific accuracy.", 
                    color: "bg-[#FFF7ED] text-[#F1622C]" 
                  },
                  { 
                    icon: Lock, title: "Enterprise Security", 
                    desc: "SOC2 compliant. Encrypted keys. Fine-grained data policies so your prompts stay private.", 
                    color: "bg-[#F0FDF4] text-[#16A34A]" 
                  },
                ].map((feature) => (
                  <div key={feature.title} className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] mb-2 tracking-tight">{feature.title}</h3>
                    <p className="text-[14px] text-[#6B7280] leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </section>

              {/* ─── HOW IT WORKS ─── */}
              <section className="bg-white border border-[#E5E5EA] rounded-[24px] p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <h3 className="text-[24px] font-bold text-[#1D1D1F] mb-8 tracking-tight text-center">Start building in 3 steps</h3>
                <div className="grid md:grid-cols-3 gap-8 relative">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-[2px] bg-[#E5E5EA] z-0" />
                  
                  {[
                    { step: "1", title: "Generate Key", desc: "Create your API credentials below. Keep your secret key safe." },
                    { step: "2", title: "Choose Model", desc: "Select from WIC Native or route to 3rd-party providers dynamically." },
                    { step: "3", title: "Deploy", desc: "Make requests using our OpenAI-compatible SDK or REST API." },
                  ].map((item, idx) => (
                    <div key={item.step} className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-[16px] font-bold mb-4 shadow-lg">
                        {item.step}
                      </div>
                      <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-2">{item.title}</h4>
                      <p className="text-[13px] text-[#6B7280] leading-relaxed max-w-[200px]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ─── CODE SNIPPET ─── */}
              <section className="bg-[#0F172A] rounded-[24px] p-6 md:p-8 border border-[#1E293B] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F1622C]/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      <Terminal className="w-4 h-4" />
                      <span className="text-[12px] font-mono font-bold uppercase tracking-wider">Quick Start</span>
                    </div>
                    <button 
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#E2E8F0] text-[12px] font-medium transition-colors border border-white/10"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-[#287A55]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="text-[13px] font-mono text-[#E2E8F0] leading-relaxed overflow-x-auto">
                    <code>
                      <span className="text-[#F1622C]">curl</span> https://api.wireways.com/v1/chat/completions {"\n"}
                      {"  "}<span className="text-[#60A5FA]">-H</span> <span className="text-[#A3E635]">"Authorization: Bearer sk_live_..."</span> {"\n"}
                      {"  "}<span className="text-[#60A5FA]">-H</span> <span className="text-[#A3E635]">"Content-Type: application/json"</span> {"\n"}
                      {"  "}<span className="text-[#60A5FA]">-d</span> <span className="text-[#A3E635]">'{"{"}</span>{"\n"}
                      {"    "}<span className="text-[#93C5FD]">"model"</span>: <span className="text-[#A3E635]">"wic-native-v1"</span>,{"\n"}
                      {"    "}<span className="text-[#93C5FD]">"messages"</span>: [{"{"}<span className="text-[#93C5FD]">"role"</span>: <span className="text-[#A3E635]">"user"</span>, <span className="text-[#93C5FD]">"content"</span>: <span className="text-[#A3E635]">"Analyze my liquidity"</span>{"}"}]{"\n"}
                      {"  "}<span className="text-[#A3E635]">{"}"}</span>'
                    </code>
                  </pre>
                </div>
              </section>

              {/* ─── ACCOUNT / KEYS SECTION ─── */}
              <section id="openwic-keys-section" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-[#E5E5EA]" />
                  <span className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Your Account</span>
                  <div className="h-px flex-1 bg-[#E5E5EA]" />
                </div>
                <ApiKeys />
              </section>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}