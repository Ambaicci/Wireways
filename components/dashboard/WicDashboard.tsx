"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, AlertTriangle,
  CheckCircle2, Lightbulb, CalendarClock, X, Eye, EyeOff,
  Send, Download, Repeat, Plus, SlidersHorizontal,
} from "lucide-react";
import SmartTableModal from "./SmartTableModal";
import SendMoneyModal from "./SendMoneyModal";
import ConvertCurrencyModal from "./ConvertModal";
import AddFundsModal from "./AddFundsModal";
import CreateLinkModal from "./CreateLinkModal";

function prefillDock(text) {
  if (text) window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_META = {
  attention: { label: "Needs attention", cls: "bg-[#FFF0E7] text-[#E84D00]", Icon: AlertTriangle },
  opportunity: { label: "Opportunity", cls: "bg-[#F1EADF] text-[#6E5B3E]", Icon: Lightbulb },
  good: { label: "All good", cls: "bg-[#E8F3EC] text-[#287A55]", Icon: CheckCircle2 },
};

export default function WicDashboard({ briefing, recent, wallets }) {
  const [explain, setExplain] = useState(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
   const [isPrivacyOn, setIsPrivacyOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isSmartTableOpen, setIsSmartTableOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const top = briefing.missions[0];
  const promoted = (top && (top.status === "attention" || top.status === "opportunity")) ? top : null;
  const remaining = promoted ? briefing.missions.slice(1) : briefing.missions;

  const fxItem = briefing.watching.find((w) => w.category === "fx");
  const otherWatch = briefing.watching.filter((w) => w.category !== "fx");

  const fullSummary = `${briefing.positionSummary} ${briefing.money.liquiditySentence}`;

  const quickActions = [
    { label: "Send", icon: Send, prompt: "Send 50,000 KES to my MPesa", manual: () => setIsSendOpen(true) },
    { label: "Request", icon: Download, prompt: "Request 1,200 USD from Global Reach GmbH", manual: () => setIsRequestOpen(true) },
    { label: "Convert", icon: Repeat, prompt: "Convert 10,000 USD to EUR", manual: () => setIsConvertOpen(true) },
    { label: "Top up", icon: Plus, prompt: "Top up my USD wallet with 5,000 USD", manual: () => setIsTopUpOpen(true) },
  ];

  return (
    <div className="max-w-[1180px] mx-auto pb-32 space-y-10 md:space-y-12">
      {/* ═══ 01 · WIC BRIEFING HERO (legible, magic score, expandable summary) ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] bg-[#312B1E] text-white p-8 md:p-9 shadow-[0_22px_65px_rgba(49,43,30,0.17)]"
      >
        <div className="absolute -top-40 -right-28 w-[430px] h-[430px] rounded-full bg-[radial-gradient(circle,rgba(241,98,44,0.4),transparent_68%)] pointer-events-none" />
        <div className="relative grid md:grid-cols-[1.3fr_0.7fr] gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-[#F9C7AA] text-[11px] font-bold tracking-[0.14em] uppercase">
              <span className="w-[22px] h-[22px] rounded-full border border-[#F1622C]/60 grid place-items-center">
                <span className="w-[7px] h-[7px] rounded-full bg-[#F1622C] shadow-[0_0_15px_#F1622C] animate-pulse" />
              </span>
              WIC · Wireways Intelligence Cloud
            </div>
            <h1 className="mt-4 text-[clamp(28px,3vw,42px)] leading-[1.05] tracking-[-0.05em] font-semibold max-w-[700px]">
              {briefing.greeting}<br />
              <em className="not-italic text-[#F6C39F]">{briefing.headline}</em>
            </h1>

            {/* Expandable summary — 3-line clamp with gradient fade */}
            <div
              className="mt-3 relative cursor-pointer group"
              onClick={() => setSummaryExpanded(!summaryExpanded)}
            >
              <p className={`text-[14px] leading-[1.7] text-[#C6BFB3] max-w-[620px] transition-all duration-300 ${summaryExpanded ? "" : "line-clamp-3"}`}>
                {fullSummary}
              </p>
              {!summaryExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#312B1E] to-transparent pointer-events-none" />
              )}
            </div>
            {!summaryExpanded && fullSummary.length > 180 && (
              <button
                onClick={() => setSummaryExpanded(true)}
                className="mt-1 text-[11px] font-semibold text-[#F9C7AA] hover:text-[#FFB16E] transition-colors"
              >
                Read more…
              </button>
            )}

            {/* Solid alert plate — action + explain in one row */}
            {promoted && (
              <div className={`mt-5 rounded-[14px] p-4 ${promoted.status === "attention" ? "bg-[#F1622C]" : "bg-[#B98A2E]"}`}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">
                  {promoted.status === "attention" ? <AlertTriangle className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  {STATUS_META[promoted.status].label}
                </div>
                <div className="mt-1.5 text-[14.5px] font-semibold text-white leading-[1.4]">{promoted.title}</div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {promoted.action?.payload && (
                    <button
                      onClick={() => prefillDock(promoted.action.payload)}
                      className="bg-white text-[#312B1E] text-[11px] font-bold px-4 py-2 rounded-[10px] hover:bg-[#F7F3EC] transition-colors"
                    >
                      {promoted.actionLabel || "Fix it"}
                    </button>
                  )}
                  <button
                    onClick={() => setExplain({
                      title: promoted.title,
                      factors: promoted.explain,
                    })}
                    className="bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-bold px-4 py-2 rounded-[10px] transition-colors"
                  >
                    Show me why
                  </button>
                </div>
              </div>
            )}
          </div>

                    {/* Confidence — Calibration Gate: judgment is earned, never guessed */}
          <div className="md:border-l md:border-white/10 md:pl-7 flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#9C9488]">WIC financial confidence</div>
            {briefing.confidence.ready ? (
              <>
                <div className="mt-1.5 text-[54px] font-bold tracking-[-0.06em] leading-none">
                  {briefing.confidence.score}<span className="text-[12px] tracking-normal text-[#B8B0A4] font-medium"> / 100</span>
                </div>
                <p className="mt-2 text-[12px] text-[#C8C0B5] leading-[1.55]">{briefing.confidence.note}</p>
                <div className="h-[5px] rounded-full bg-white/10 my-3.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${briefing.confidence.score}%` }}
                    transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#F1622C] to-[#FFB16E]"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#958D81]"><span>Needs attention</span><span>Strong position</span></div>
              </>
            ) : (
              <>
                <div className="mt-1.5 text-[54px] font-bold tracking-[-0.06em] leading-none text-[#7A7264]">
                  —<span className="text-[12px] tracking-normal text-[#B8B0A4] font-medium"> / 100</span>
                </div>
                <p className="mt-2 text-[12px] text-[#C8C0B5] leading-[1.55]">{briefing.confidence.note}</p>
                <div className="h-[5px] rounded-full bg-white/10 my-3.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (briefing.confidence.observedCount / briefing.confidence.threshold) * 100)}%` }}
                    transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#8C8579] to-[#B8B0A4]"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#958D81]">
                  <span>{briefing.confidence.observedCount} of {briefing.confidence.threshold} movements observed</span>
                  <span>Rating unlocks soon</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* ═══ 02 · QUICK ACTIONS ═══ */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {quickActions.map((a) => (
            <div key={a.label}
              className="flex items-stretch rounded-[9px] overflow-hidden border border-[#F0E1D2] bg-[#FFFDF9] shadow-[0_1px_2px_rgba(49,43,30,0.04)] transition-colors hover:border-[#E8CDB4]">
              <button onClick={() => prefillDock(a.prompt)} title="Ask WIC"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#F1622C] hover:bg-[#E0531C] text-white py-2 pl-3 pr-2 text-[12px] font-semibold tracking-[-0.01em] transition-colors">
                <a.icon className="w-3.5 h-3.5" />
                {a.label}
              </button>
              <button onClick={a.manual} title="Manual mode"
                className="w-9 grid place-items-center bg-[#FDEBE0] hover:bg-[#FBDCC8] text-[#C94A1D] transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 03 · REMAINING MISSIONS ═══ */}
      {remaining.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-3 px-0.5">
            <div>
              <h2 className="text-[18px] tracking-[-0.035em] font-semibold text-[#312B1E]">
                WIC has {remaining.length} more thing{remaining.length === 1 ? "" : "s"} for you
              </h2>
              <p className="text-[12px] text-[#8D8476] mt-1">Not everything needs your attention. These do.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {remaining.map((m, i) => {
              const meta = STATUS_META[m.status];
              return (
                <motion.article key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[18px] p-5 min-h-[180px] shadow-[0_5px_22px_rgba(49,43,30,0.035)] hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(49,43,30,0.08)] hover:border-[#DDCDBA] transition-all">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-[7px] ${meta.cls}`}>{meta.label}</span>
                    <button onClick={() => setExplain({ title: m.title, factors: m.explain })}
                      className="text-[#B1A79A] hover:text-[#312B1E] transition-colors" title="Why?">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="mt-3.5 text-[14px] leading-[1.35] tracking-[-0.02em] font-semibold text-[#312B1E]">{m.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-[1.55] text-[#8D8476]">{m.detail}</p>
                  {m.action?.payload && (
                    <button onClick={() => prefillDock(m.action.payload)}
                      className="mt-3 text-[11px] font-bold text-[#E84D00] hover:text-[#F1622C] transition-colors">
                      {m.actionLabel} →
                    </button>
                  )}
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ 04 · YOUR MONEY ═══ */}
      <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[22px] p-6 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
        <div className="flex justify-between items-start gap-5 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="text-[11px] text-[#8D8476] font-bold uppercase tracking-[0.08em]">Total available balance</div>
              <button
                onClick={() => setIsPrivacyOn(!isPrivacyOn)}
                className={`w-[26px] h-[26px] rounded-[7px] border flex items-center justify-center transition-all ${isPrivacyOn ? "bg-[#312B1E] text-white border-[#312B1E]" : "bg-[#FFFBF6] text-[#8D8476] border-[#E8E0D4] hover:text-[#312B1E]"}`}
                title={isPrivacyOn ? "Show balances" : "Hide balances"}
              >
                {isPrivacyOn ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-1 text-[40px] font-bold tracking-[-0.055em] text-[#312B1E] tabular-nums">
              {isPrivacyOn ? "••••••" : (
                <>
                  ${Math.floor(briefing.money.totalUsd).toLocaleString()}
                  <small className="text-[19px] text-[#A9A093] font-medium">
                    .{String(Math.round((briefing.money.totalUsd % 1) * 100)).padStart(2, "0")}
                  </small>
                </>
              )}
            </div>
            <p className="text-[12px] text-[#8D8476] mt-1">{isPrivacyOn ? "Balances hidden" : briefing.money.breakdownSentence}</p>
          </div>
                  {briefing.confidence.ready ? (
            <div className="bg-[#E8F3EC] text-[#287A55] rounded-[10px] px-3 py-2 text-[11px] font-bold">
              <span className="block text-[13px] mb-0.5">{briefing.confidence.label}</span>
              {briefing.money.liquidityDays} days of liquidity
            </div>
          ) : (
            <div className="bg-[#F1EADF] text-[#6E5B3E] rounded-[10px] px-3 py-2 text-[11px] font-bold">
              <span className="block text-[13px] mb-0.5">Calibrating</span>
              {briefing.confidence.observedCount} of {briefing.confidence.threshold} movements observed
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-[#E8E0D4] mt-5 pt-1">
          {briefing.money.breakdown.map((w) => (
            <div key={w.currency} className="py-3 pr-3">
              <div className="text-[10px] text-[#8D8476]">{w.currency} · {isPrivacyOn ? "—" : `${w.sharePct}%`}</div>
              <div className="text-[13px] font-semibold text-[#312B1E] tabular-nums mt-1">
                {isPrivacyOn ? "••••" : w.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="h-1 bg-[#F1EADF] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#F1622C] rounded-full" style={{ width: isPrivacyOn ? "0%" : `${w.sharePct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 05 · WIC INSIGHTS ═══ */}
      <section>
        <div className="mb-3 px-0.5">
          <h2 className="text-[18px] tracking-[-0.035em] font-semibold text-[#312B1E]">WIC Insights</h2>
          <p className="text-[12px] text-[#8D8476] mt-1">Context around the money — not just the numbers.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {fxItem && (
            <article className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[19px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[14px] font-bold text-[#312B1E]">
                  <span className="w-2 h-2 rounded-full bg-[#F1622C]" /> FX position
                </div>
                <span className="text-[9px] text-[#8D8476] uppercase tracking-[0.1em]">Live</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="text-[26px] font-bold tracking-[-0.045em] text-[#312B1E] tabular-nums">
                    {fxItem.target} {fxItem.rate?.toFixed(4)}
                  </div>
                  <p className="text-[12px] leading-[1.55] text-[#8D8476] mt-1.5 max-w-[300px]">{fxItem.detail}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => prefillDock(fxItem.convertPayload)}
                    className="border border-[#EADFD2] bg-[#FFFAF4] text-[#E84D00] rounded-[9px] px-3 py-2 text-[10px] font-bold whitespace-nowrap hover:bg-[#FFF0E7] transition-colors">
                    Convert with WIC
                  </button>
                  <button onClick={() => setIsSmartTableOpen(true)}
                    className="border border-[#E8E0D4] bg-white text-[#7C6B51] rounded-[9px] px-3 py-2 text-[10px] font-bold whitespace-nowrap hover:border-[#D7CABB] transition-colors">
                    See all rates
                  </button>
                </div>
              </div>
            </article>
          )}
          {otherWatch.map((w) => (
            <article key={w.id} className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[19px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[14px] font-bold text-[#312B1E]">
                  <span className="w-2 h-2 rounded-full bg-[#287A55]" /> Anticipation
                </div>
                <span className="text-[9px] text-[#8D8476] uppercase tracking-[0.1em]">Memory</span>
              </div>
              <div className="text-[18px] font-bold tracking-[-0.03em] text-[#312B1E]">{w.title}</div>
              <p className="text-[12px] leading-[1.55] text-[#8D8476] mt-1.5">{w.detail}</p>
              {w.action?.payload && (
                <button onClick={() => prefillDock(w.action.payload)}
                  className="mt-4 border border-[#EADFD2] bg-[#FFFAF4] text-[#E84D00] rounded-[9px] px-3 py-2 text-[10px] font-bold hover:bg-[#FFF0E7] transition-colors">
                  {w.actionLabel} →
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ═══ 06 · COMING UP + RECENT MOVEMENT ═══ */}
      <div className="grid md:grid-cols-2 gap-3">
        <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[19px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#312B1E]">
              <CalendarClock className="w-4 h-4 text-[#F1622C]" /> Coming up
            </div>
            <Link href="/wire-roll" className="text-[11px] font-bold text-[#E84D00] hover:text-[#F1622C] transition-colors">
              Full schedule →
            </Link>
          </div>
          {briefing.upcoming.map((u, i) => (
            <div key={u.id} className={`grid grid-cols-[84px_1fr_auto] gap-3 items-center py-3 ${i > 0 ? "border-t border-[#E8E0D4]" : ""}`}>
              <div className="text-[11px] text-[#8D8476] font-bold">{u.dateLabel}</div>
              <div>
                <div className="text-[13px] font-semibold text-[#312B1E]">{u.name}</div>
                <div className="text-[11px] text-[#8D8476] mt-0.5">{u.currency} · in {u.daysUntilRun}d</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-[#312B1E] tabular-nums">{isPrivacyOn ? "••••" : u.amountLabel}</div>
                <div className={`text-[10px] mt-0.5 ${u.funded ? "text-[#287A55]" : "text-[#E84D00]"}`}>
                  {u.funded ? "Fully funded" : u.gapLabel}
                </div>
              </div>
            </div>
          ))}
        </section>

        {recent.length > 0 && (
          <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[19px] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="text-[14px] font-bold text-[#312B1E]">Recent movement</div>
              <Link href="/payments" className="text-[11px] font-bold text-[#E84D00] hover:text-[#F1622C] transition-colors">
                See all →
              </Link>
            </div>
            {recent.map((t, i) => (
              <div key={t.id} className={`grid grid-cols-[36px_1fr_auto] gap-3 items-center px-5 py-3.5 ${i > 0 ? "border-t border-[#E8E0D4]" : ""}`}>
                <div className={`w-9 h-9 rounded-[10px] grid place-items-center ${t.type === "in" ? "bg-[#E8F3EC]" : "bg-[#F5EFE6]"}`}>
                  {t.type === "in" ? <ArrowDownLeft className="w-4 h-4 text-[#287A55]" /> : <ArrowUpRight className="w-4 h-4 text-[#7C6B51]" />}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#312B1E]">{t.name}</div>
                  <div className="text-[11px] text-[#8D8476] mt-0.5">{t.rail}{mounted ? ` · ${timeAgo(t.createdAt)}` : ""}</div>
                </div>
                <div className={`text-[13px] font-bold tabular-nums ${t.type === "in" ? "text-[#287A55]" : "text-[#312B1E]"}`}>
                  {isPrivacyOn ? "••••" : `${t.type === "in" ? "+" : "−"}${t.amount.toLocaleString()}`}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      <SmartTableModal isOpen={isSmartTableOpen} onClose={() => setIsSmartTableOpen(false)} />
      <AnimatePresence>
        {isSendOpen && <SendMoneyModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} wallets={wallets} />}
        {isConvertOpen && <ConvertCurrencyModal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} />}
        {isTopUpOpen && <AddFundsModal currency="USD" isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />}
        {isRequestOpen && <CreateLinkModal onClose={() => setIsRequestOpen(false)} />}
      </AnimatePresence>

      {/* ═══ EXPLAIN MODAL ═══ */}
      <AnimatePresence>
        {explain && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#312B1E]/40 backdrop-blur-[7px] z-[70] flex items-end md:items-center justify-center p-5"
            onClick={() => setExplain(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-[#FFFDF9] rounded-[23px] p-6 w-full max-w-[560px] shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-[18px] font-semibold text-[#312B1E]">{explain.title}</h3>
                <button onClick={() => setExplain(null)} className="w-[30px] h-[30px] rounded-[9px] bg-[#F5EFE6] grid place-items-center text-[#312B1E]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[12px] text-[#8D8476] mt-2 leading-[1.6]">WIC doesn't guess — here's exactly what it checked:</p>
              <div className="mt-3 space-y-2">
                {explain.factors.map((f, i) => (
                  <div key={i} className="p-3 border border-[#E8E0D4] rounded-[13px] bg-[#FFFBF6] text-[12px] text-[#51483A] leading-[1.5]">{f}</div>
                ))}
              </div>
              <button onClick={() => setExplain(null)}
                className="mt-4 w-full bg-[#312B1E] text-white text-[12px] font-bold py-2.5 rounded-[10px] hover:bg-black transition-colors">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}