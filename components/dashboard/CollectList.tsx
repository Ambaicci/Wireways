"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, X, Copy, Mail, MessageCircle, ArrowUpRight, Check, FileText, Repeat } from "lucide-react";
import WicStar from "./WicStar";

const ACCENT = "#B98A2E";
const ACCENT_SOFT = "rgba(185,138,46,0.14)";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatAmount = (amount: number, currency: string) => {
  if (currency === "USDC") return `${amount.toLocaleString()} USDC`;
  if (currency === "KES") return `KSh ${amount.toLocaleString()}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
};

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "Active"
      ? "bg-[#E8F3EC] text-[#287A55]"
      : status === "Paid"
      ? "bg-[#F1EADF] text-[#6E5B3E]"
      : "bg-[#F5EFE6] text-[#8D8476]";
  return <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

export default function CollectList({ links }: { links: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const shareText = (l: any) =>
    `Payment request${l.description ? `: ${l.description}` : ""} — ${formatAmount(l.amount, l.currency)}. Pay securely: ${APP_URL}/pay/${l.id}`;

  const handleCopy = async () => {
    if (!selected) return;
    const url = `${APP_URL}/pay/${selected.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const repeatPrompt = (l: any) => {
    return `Create a payment link for ${formatAmount(l.amount, l.currency)}${l.description ? ` for ${l.description}` : ""}`;
  };

  return (
    <>
      {/* ═══ Invoice rows — clickable ═══ */}
      <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] divide-y divide-dashed divide-[#F1EADF] overflow-hidden shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
        {links.map((link) => (
          <div
            key={link.id}
            onClick={() => setSelected(link)}
            className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-[#F7F2EA] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ACCENT_SOFT }}
              >
                <FileText className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[14px] font-semibold text-[#312B1E] truncate group-hover:text-[#C94A1D] transition-colors">
                    {link.description || "Untitled invoice"}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold text-[#8D8476] bg-[#F5EFE6] border border-[#E8E0D4] rounded-md px-1.5 py-0.5">
                    INV-{String(link.id).padStart(4, "0")}
                  </span>
                </div>
                <p className="text-[11.5px] font-mono text-[#8D8476] mt-0.5 truncate">
                  wireways.com/pay/{link.id} · {formatDate(link.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="font-mono text-[14px] font-semibold text-[#312B1E] tabular-nums">
                  {formatAmount(link.amount, link.currency)}
                </div>
                <div className="mt-1"><StatusChip status={link.status} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Detail modal ═══ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center p-5"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-[480px] bg-[#FFFDF9] rounded-[23px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[12px] grid place-items-center"
                    style={{ backgroundColor: ACCENT_SOFT }}
                  >
                    <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[#312B1E]">
                      {selected.description || "Untitled invoice"}
                    </div>
                    <div className="mt-1"><StatusChip status={selected.status} /></div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-[30px] h-[30px] rounded-[9px] bg-[#F5EFE6] grid place-items-center text-[#312B1E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 text-[32px] font-bold tabular-nums tracking-[-0.04em] text-[#312B1E]">
                {formatAmount(selected.amount, selected.currency)}
              </div>

              <div className="mt-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">Invoice ID</span>
                  <span className="text-[12px] font-medium text-[#51483A] font-mono">INV-{String(selected.id).padStart(4, "0")}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">Created</span>
                  <span className="text-[12px] font-medium text-[#51483A]">{formatDate(selected.created_at)}</span>
                </div>
                {selected.description && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">For</span>
                    <span className="text-[12px] font-medium text-[#51483A] text-right max-w-[200px] truncate">{selected.description}</span>
                  </div>
                )}
              </div>

              {/* Share link */}
              <div className="mt-4 rounded-[12px] border border-[#EED7C7] bg-gradient-to-br from-[#FFF7F0] to-[#FFFDF9] p-4">
                <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Share link</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 font-mono text-[11px] text-[#51483A] truncate bg-white/60 rounded-[8px] px-2.5 py-2 border border-[#E8E0D4]">
                    {`${APP_URL}/pay/${selected.id}`}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[11px] font-bold transition-colors"
                    style={{ backgroundColor: ACCENT, color: "white" }}
                  >
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>

                {/* Share actions */}
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText(selected))}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[11px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Invoice INV-${String(selected.id).padStart(4, "0")} — ${selected.description || "Payment request"}`)}&body=${encodeURIComponent(shareText(selected))}`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[11px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                  <a
                    href={`/pay/${selected.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[11px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Open
                  </a>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-[#E8E0D4] bg-[#FFFBF6] px-4 py-3">
                <WicStar className="w-4 h-4 text-[#F1622C]" />
                <span className="text-[12px] text-[#6E665A]">WIC can draft a similar link in one tap.</span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[12px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    prefillDock(repeatPrompt(selected));
                    setSelected(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[10px] text-white py-2.5 text-[12px] font-bold hover:brightness-110 transition-colors"
                  style={{ background: ACCENT }}
                >
                  <Repeat className="w-3.5 h-3.5" /> Draft similar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}