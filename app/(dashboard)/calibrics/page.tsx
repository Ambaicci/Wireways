"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Zap, ArrowRight, Loader2, CheckCircle2,
  Coffee, Shirt, Code, ShoppingCart, FileText, Terminal, MessageCircle,
  XCircle, Network, DollarSign, Copy, Check, ShieldCheck, ExternalLink, X
} from "lucide-react";

const CURRENCIES = ["USD", "KES", "JPY", "EUR", "GBP", "CNY"];

type Tab = "overview" | "integrations";
type Platform = "shopify" | "wordpress" | "custom" | "api";
type InstallModal = "shopify" | "wordpress" | null;

const PLATFORMS = [
  { id: "shopify" as Platform, name: "Shopify", desc: "One-click install from the App Store", icon: ShoppingCart, color: "bg-[#9C6B08]" },
  { id: "wordpress" as Platform, name: "WordPress", desc: "Install via the Plugin Directory", icon: FileText, color: "bg-[#287A55]" },
  { id: "custom" as Platform, name: "Custom HTML/JS", desc: "Add 2 lines of code to any site", icon: Terminal, color: "bg-[#1C1917]" },
  { id: "api" as Platform, name: "Backend API", desc: "Direct integration for custom checkouts", icon: Code, color: "bg-[#4C5C88]" },
];

export default function CalibricsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [activePlatform, setActivePlatform] = useState<Platform>("custom");
  const [copiedStep1, setCopiedStep1] = useState(false);
  const [copiedStep2, setCopiedStep2] = useState(false);
  const [installModal, setInstallModal] = useState<InstallModal>(null);

  const [baseAmount, setBaseAmount] = useState("245");
  const [baseCurrency, setBaseCurrency] = useState("ETB");
  const [productName, setProductName] = useState("1kg Arabica Coffee");
  const [calibrations, setCalibrations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCalibrations = async () => {
      if (!baseAmount || isNaN(Number(baseAmount))) return;
      setIsLoading(true);
      try {
        const results: Record<string, any> = {};
        for (const target of CURRENCIES) {
          const res = await fetch("/api/calibrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Number(baseAmount), baseCurrency, targetCurrency: target }),
          });
          const data = await res.json();
          if (data.success) results[target] = data.calibrated;
        }
        setCalibrations(results);
      } catch (error) {
        console.error("Calibrics fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    const timer = setTimeout(fetchCalibrations, 500);
    return () => clearTimeout(timer);
  }, [baseAmount, baseCurrency]);

  const handleCopyStep1 = () => {
    const text = '<script src="https://your-domain.com/calibrics.js" data-api="https://your-domain.com/api/calibrics"></script>';
    navigator.clipboard.writeText(text);
    setCopiedStep1(true);
    setTimeout(() => setCopiedStep1(false), 2000);
  };

  const handleCopyStep2 = () => {
    const text = '<span class="wireways-price" data-base="245" data-currency="ETB">\n  245 ETB\n</span>';
    navigator.clipboard.writeText(text);
    setCopiedStep2(true);
    setTimeout(() => setCopiedStep2(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F3] text-[#1D1D1F]">

      {/* ─── DARK HERO ─── */}
      <section className="bg-[#1C1917] text-white pt-16 pb-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#F1622C] text-[11px] font-mono font-bold uppercase tracking-widest mb-6">
            <Globe className="w-3.5 h-3.5" />
            Wireways · Global Pricing
          </div>
          <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-[1.1] mb-6">
            Set your price once.<br />
            <span className="text-[#F1622C]">Let the world see it in theirs.</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Calibrics automatically shows your products in every customer's local currency, using live exchange rates — so your margins stay protected, and your buyers feel at home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 border-t border-white/10 pt-8 max-w-3xl mx-auto">
            {[
              { val: "Live", label: "Exchange Rates" },
              { val: "0ms", label: "Added Latency" },
              { val: "100%", label: "Margin Protected" },
              { val: "2 Lines", label: "Of Code to Integrate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[24px] md:text-[28px] font-mono font-bold text-white">{stat.val}</div>
                <div className="text-[10px] md:text-[11px] text-white/40 uppercase tracking-widest mt-1 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24">

        {/* ─── TAB SWITCHER ─── */}
        <div className="flex gap-1 border-b border-[#E5E5EA] pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 text-[13px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
              activeTab === "overview"
                ? "bg-white text-[#1D1D1F] border border-b-0 border-[#E5E5EA] -mb-px"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("integrations")}
            className={`px-6 py-3 text-[13px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
              activeTab === "integrations"
                ? "bg-white text-[#1D1D1F] border border-b-0 border-[#E5E5EA] -mb-px"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            Integrations
          </button>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* ─── OVERVIEW TAB ─── */}
        {/* ═══════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-24">

            {/* THE PROBLEM */}
            <section>
              <div className="mb-8">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">The Friction</p>
                <h2 className="text-[28px] font-extrabold tracking-tight">Global buyers shouldn't have to do mental math.</h2>
              </div>
              <div className="border border-[#E5E5EA] rounded-[16px] overflow-hidden bg-white shadow-sm">
                {[
                  { title: "Mental Conversion", desc: "A buyer in Japan sees ¥18,000 and has to manually calculate the value." },
                  { title: "Currency Confusion", desc: "A buyer in Kenya sees $120 and wonders how much that is in KES today." },
                  { title: "Lost Sales", desc: "Friction at checkout leads to abandoned carts when prices aren't clear." },
                ].map((item, idx) => (
                  <div key={item.title} className={`flex items-start gap-4 px-6 py-5 border-b border-[#E5E5EA] hover:bg-[#FAFAFA] transition-colors ${idx === 2 ? "border-b-0" : ""}`}>
                    <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <div>
                      <div className="font-mono text-[13px] font-bold text-[#1D1D1F]">{item.title}</div>
                      <div className="text-[13px] text-[#86868B] mt-1">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* THE SOLUTION */}
            <section>
              <div className="mb-8">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">The Solution</p>
                <h2 className="text-[28px] font-extrabold tracking-tight">How Calibrics works</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "1. You set your base price", desc: "e.g., 245 ETB for 1kg of coffee", icon: DollarSign, color: "bg-[#F1622C]" },
                  { title: "2. Calibrics fetches live rates", desc: "Real-time exchange rates, updated hourly", icon: Network, color: "bg-[#4C5C88]" },
                  { title: "3. Customers see local prices", desc: "$4.50 USD, ¥680 JPY, 575 KES — automatically", icon: Globe, color: "bg-[#287A55]" },
                ].map((step) => (
                  <div key={step.title} className="bg-white border border-[#E5E5EA] rounded-[16px] p-6 shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] mb-2">{step.title}</h3>
                    <p className="text-[13px] text-[#86868B] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <p className="text-[14px] font-mono font-bold text-[#1D1D1F] bg-[#F1622C]/5 inline-block px-4 py-2 rounded-full">
                  No manual math. No stale rates. No lost sales.
                </p>
              </div>
            </section>

            {/* USE CASES */}
            <section>
              <div className="mb-8">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">Use Cases</p>
                <h2 className="text-[28px] font-extrabold tracking-tight">Built for businesses that sell globally</h2>
              </div>
              <div className="border border-[#E5E5EA] rounded-[16px] overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-12 bg-[#FAFAFA] border-b border-[#E5E5EA] px-6 py-3">
                  <span className="col-span-4 text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Business Type</span>
                  <span className="col-span-6 text-[10px] font-bold text-[#86868B] uppercase tracking-wider">The Calibrics Advantage</span>
                  <span className="col-span-2 text-[10px] font-bold text-[#86868B] uppercase tracking-wider text-right">Status</span>
                </div>
                {[
                  { name: "The Global Exporter", desc: "Ethiopian coffee farmer selling to US, Japan, Kenya.", detail: "Each buyer sees the price in their local currency instantly.", icon: Coffee, color: "bg-[#F1622C]" },
                  { name: "The Cross-Border Artisan", desc: "Kenyan leather maker on Shopify.", detail: "Customers in 40+ countries see prices that feel local.", icon: Shirt, color: "bg-[#4C5C88]" },
                  { name: "The SaaS Founder", desc: "Developer charging $29/month.", detail: "EU sees €27, UK sees £24, automatically.", icon: Code, color: "bg-[#287A55]" },
                ].map((uc, idx) => (
                  <div key={uc.name} className={`grid grid-cols-12 items-center px-6 py-5 border-b border-[#E5E5EA] hover:bg-[#FAFAFA] transition-colors ${idx === 2 ? "border-b-0" : ""}`}>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${uc.color} flex items-center justify-center flex-shrink-0`}>
                        <uc.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="font-mono text-[13px] font-bold text-[#1D1D1F]">{uc.name}</div>
                    </div>
                    <div className="col-span-6">
                      <div className="text-[13px] text-[#1D1D1F] font-medium">{uc.detail}</div>
                      <div className="text-[12px] text-[#86868B] mt-0.5">{uc.desc}</div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#287A55]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#287A55]" /> Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* LIVE DEMO */}
            <section className="bg-[#1C1917] rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
              <div className="p-6 md:p-8 border-b border-white/10">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">Live Preview</p>
                <h2 className="text-[24px] font-extrabold text-white tracking-tight">See it in action.</h2>
                <p className="text-white/60 mt-2 text-[14px]">Change the base price below and watch global prices update in real-time.</p>
                <div className="bg-black/40 rounded-[16px] border border-white/10 p-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-[#F1622C]" />
                    <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Base Product Configuration</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Product Name</label>
                      <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[8px] px-4 py-3 text-[14px] text-white outline-none focus:border-[#F1622C] transition-colors" placeholder="e.g., 1kg Arabica Coffee" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Base Amount</label>
                      <input type="number" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[8px] px-4 py-3 text-[14px] text-white outline-none focus:border-[#F1622C] transition-colors font-mono" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Base Currency</label>
                      <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[8px] px-4 py-3 text-[14px] text-white outline-none focus:border-[#F1622C] transition-colors">
                        <option value="ETB">ETB (Ethiopian Birr)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="KES">KES (Kenyan Shilling)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CURRENCIES.map((target) => {
                    const data = calibrations[target];
                    return (
                      <motion.div key={target} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black/20 border border-white/5 rounded-[12px] p-5 flex items-center justify-between hover:border-[#F1622C]/30 transition-colors">
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{target}</p>
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                          ) : data ? (
                            <p className="text-[20px] font-mono font-bold text-white tabular-nums">
                              {target === "USD" ? "$" : target === "EUR" ? "€" : target === "GBP" ? "£" : target === "JPY" ? "¥" : target === "CNY" ? "¥" : ""}
                              {data.amount.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-[14px] text-white/40">--</p>
                          )}
                        </div>
                        {data && !isLoading && (
                          <div className="w-8 h-8 rounded-full bg-[#287A55]/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-[#287A55]" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* ─── INTEGRATIONS TAB ─── */}
        {/* ═══════════════════════════════════════ */}
        {activeTab === "integrations" && (
          <div className="space-y-12">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">Integration Hub</p>
              <h2 className="text-[28px] font-extrabold tracking-tight">Connect your store in minutes.</h2>
              <p className="text-[#86868B] mt-3 text-[15px] max-w-2xl leading-relaxed">
                Choose your platform below. We provide everything you need to start calibrating prices for a global audience.
              </p>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLATFORMS.map((platform) => {
                const isActive = activePlatform === platform.id;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => setActivePlatform(platform.id)}
                    className={`flex flex-col items-start gap-4 p-5 rounded-[16px] border transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-white border-[#F1622C] shadow-lg shadow-[#F1622C]/5 ring-1 ring-[#F1622C]"
                        : "bg-white border-[#E5E5EA] hover:border-[#D1D1D6] hover:shadow-md"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center flex-shrink-0`}>
                      <platform.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1D1D1F] mb-1">{platform.name}</h3>
                      <p className="text-[12px] text-[#86868B] leading-snug">{platform.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Content */}
            <div className="bg-white border border-[#E5E5EA] rounded-[24px] p-8 shadow-sm">
              <h3 className="text-[20px] font-extrabold tracking-tight mb-6 pb-6 border-b border-[#E5E5EA]">
                {PLATFORMS.find((p) => p.id === activePlatform)?.name} Integration Guide
              </h3>

              {activePlatform === "shopify" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 rounded-[16px] bg-[#F1622C]/5 border border-[#F1622C]/20">
                    <ShieldCheck className="w-6 h-6 text-[#F1622C] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-1">Wireways Calibrics for Shopify</h4>
                      <p className="text-[14px] text-[#86868B] leading-relaxed mb-4">
                        Our official Shopify App is currently in beta. Click below to see the installation preview.
                      </p>
                      <button
                        type="button"
                        onClick={() => setInstallModal("shopify")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#F1622C] text-white text-[14px] font-bold hover:bg-[#D4511E] transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" /> Preview Shopify Install
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === "wordpress" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 rounded-[16px] bg-[#287A55]/5 border border-[#287A55]/20">
                    <ShieldCheck className="w-6 h-6 text-[#287A55] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-1">Wireways Calibrics for WordPress</h4>
                      <p className="text-[14px] text-[#86868B] leading-relaxed mb-4">
                        Our WooCommerce plugin is currently in beta. Click below to see the installation preview.
                      </p>
                      <button
                        type="button"
                        onClick={() => setInstallModal("wordpress")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#287A55] text-white text-[14px] font-bold hover:bg-[#1F5F43] transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4" /> Preview WordPress Install
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === "custom" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-3">Step 1: Add the script to your head tag</h4>
                    <div className="relative">
                      <pre className="bg-[#1C1917] rounded-[12px] p-5 font-mono text-[13px] leading-relaxed text-[#E8E6E3] overflow-x-auto border border-white/10">
                        <code>{'<script src="https://your-domain.com/calibrics.js" data-api="https://your-domain.com/api/calibrics"></script>'}</code>
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopyStep1}
                        className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold transition-colors border border-white/10 cursor-pointer"
                      >
                        {copiedStep1 ? <Check className="w-3.5 h-3.5 text-[#287A55]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedStep1 ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-3">Step 2: Tag your prices</h4>
                    <div className="relative">
                      <pre className="bg-[#1C1917] rounded-[12px] p-5 font-mono text-[13px] leading-relaxed text-[#9ECE6A] overflow-x-auto border border-white/10">
                        <code>{'<span class="wireways-price" data-base="245" data-currency="ETB">\n  245 ETB\n</span>'}</code>
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopyStep2}
                        className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold transition-colors border border-white/10 cursor-pointer"
                      >
                        {copiedStep2 ? <Check className="w-3.5 h-3.5 text-[#287A55]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedStep2 ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activePlatform === "api" && (
                <div className="space-y-6">
                  <p className="text-[14px] text-[#86868B] leading-relaxed">
                    Send a POST request to our API with the base amount and currencies.
                  </p>
                  <pre className="bg-[#1C1917] rounded-[12px] p-5 font-mono text-[13px] leading-relaxed text-[#E8E6E3] overflow-x-auto border border-white/10">
                    <code>{`curl -X POST https://your-domain.com/api/calibrics \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 245,\n    "baseCurrency": "ETB",\n    "targetCurrency": "USD"\n  }'`}</code>
                  </pre>
                  <div className="flex items-center gap-2 text-[13px] text-[#287A55] font-medium">
                    <Check className="w-4 h-4" />
                    <span>Response includes calibrated amount, effective rate, and timestamp.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CTA ─── */}
        <section className="text-center pb-12">
          <h2 className="text-[32px] font-extrabold tracking-tight mb-4">Ready to go global?</h2>
          <p className="text-[16px] text-[#86868B] mb-8 max-w-[500px] mx-auto">
            Start calibrating your prices in minutes. No credit card required.
          </p>
          <button type="button" className="inline-flex items-center gap-2 px-8 py-4 rounded-[12px] bg-[#F1622C] text-white text-[15px] font-bold hover:bg-[#D4511E] transition-colors shadow-lg shadow-[#F1622C]/20 cursor-pointer">
            Start Calibrating My Prices <ArrowRight className="w-4 h-4" />
          </button>
        </section>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ─── INSTALL MODALS ─── */}
      {/* ═══════════════════════════════════════ */}
      <AnimatePresence>
        {installModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setInstallModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[24px] w-full max-w-[560px] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between ${
                installModal === "shopify" ? "bg-[#9C6B08]/5" : "bg-[#287A55]/5"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${installModal === "shopify" ? "bg-[#9C6B08]" : "bg-[#287A55]"} flex items-center justify-center`}>
                    {installModal === "shopify" ? (
                      <ShoppingCart className="w-5 h-5 text-white" />
                    ) : (
                      <FileText className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                      {installModal === "shopify" ? "Shopify App" : "WordPress Plugin"}
                    </h3>
                    <p className="text-[12px] text-[#86868B]">Installation Preview</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInstallModal(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {installModal === "shopify" && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F1622C]/10 border border-[#F1622C]/20">
                      <span className="text-[11px] font-bold text-[#F1622C] uppercase tracking-wider">Beta Access</span>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[15px] font-bold text-[#1D1D1F]">Installation Steps:</h4>
                      <div className="space-y-3">
                        {[
                          "Go to your Shopify Admin",
                          "Navigate to Apps → Shopify App Store",
                          "Search for 'Wireways Calibrics'",
                          "Click 'Add app' and authorize",
                          "Configure your base currency and products",
                        ].map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#9C6B08]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[11px] font-bold text-[#9C6B08]">{idx + 1}</span>
                            </div>
                            <p className="text-[14px] text-[#1D1D1F]">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#E5E5EA]">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[#9C6B08] text-white text-[14px] font-bold hover:bg-[#7A5506] transition-colors cursor-pointer"
                      >
                        Request Beta Access <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}

                {installModal === "wordpress" && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#287A55]/10 border border-[#287A55]/20">
                      <span className="text-[11px] font-bold text-[#287A55] uppercase tracking-wider">Beta Access</span>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[15px] font-bold text-[#1D1D1F]">Installation Steps:</h4>
                      <div className="space-y-3">
                        {[
                          "Go to your WordPress Admin",
                          "Navigate to Plugins → Add New",
                          "Search for 'Wireways Calibrics'",
                          "Click 'Install Now' then 'Activate'",
                          "Go to Settings → Wireways Calibrics to configure",
                        ].map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#287A55]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[11px] font-bold text-[#287A55]">{idx + 1}</span>
                            </div>
                            <p className="text-[14px] text-[#1D1D1F]">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#E5E5EA]">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[#287A55] text-white text-[14px] font-bold hover:bg-[#1F5F43] transition-colors cursor-pointer"
                      >
                        Request Beta Access <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}