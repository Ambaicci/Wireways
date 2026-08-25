"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Loader2, Link2, Check, AlertTriangle, Copy } from "lucide-react";
import { createPaymentLink } from "@/lib/actions";
import WicStar from "./WicStar";

const ACCENT = "#B98A2E";
const ACCENT_SOFT = "rgba(185,138,46,0.14)";

const currencies = ["USD", "EUR", "GBP", "USDC", "KES"];

export default function CreateLinkModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [aiText, setAiText] = useState("");
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleAiFill = async () => {
    if (!aiText.trim() || isAiFilling) return;
    setIsAiFilling(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Create a payment link for this request: ${aiText}` }),
      });
      const data = await res.json();
      if (data.success && data.draft?.actionType === "createPaymentLink") {
        const p = data.draft.payload || {};
        if (p.description) setDescription(p.description);
        if (p.amount) setAmount(String(p.amount));
        if (p.currency) setCurrency(p.currency);
      } else {
        setError(data.message || "Include an amount and currency.");
      }
    } catch {
      setError("WIC is unreachable right now.");
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await createPaymentLink({
      amount: parseFloat(amount) || 0,
      currency,
      description: description.trim(),
    });
    setSaving(false);
    if (res.success) {
      const link = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${(res as any).linkId ?? Date.now()}`;
      setCreatedLink(link);
      router.refresh();
    } else {
      setError(res.message || "Could not create the link.");
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDone = () => {
    setDescription(""); setAmount(""); setCurrency("USD");
    setAiText(""); setError(null); setCreatedLink(null); setCopied(false);
    onClose();
  };

  const inputCls = "w-full border border-[#E8E0D4] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#312B1E] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white placeholder:text-[#B3AC9F]";
  const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

  return (
    <motion.div
      className="fixed inset-0 bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={handleDone}
    >
      <motion.div
        className="bg-[#FFFDF9] rounded-t-[23px] md:rounded-[23px] w-full md:max-w-md shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-[#E8E0D4] overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F1EADF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ backgroundColor: ACCENT_SOFT }}>
              <Link2 className="w-4 h-4" style={{ color: ACCENT } as any} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold tracking-[-0.02em] text-[#312B1E]">Create payment link</h3>
              <p className="text-[11px] text-[#8D8476] mt-0.5">Invoicing without paperwork.</p>
            </div>
          </div>
          <button onClick={handleDone} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D8476] hover:bg-[#F5EFE6] hover:text-[#312B1E] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdLink ? (
          /* ═══ SUCCESS — share card ═══ */
          <div className="p-7">
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="mx-auto flex w-16 h-16 items-center justify-center rounded-full border shadow-[0_0_0_6px_rgba(40,122,85,0.10)]"
              style={{ backgroundColor: "rgba(40,122,85,0.12)", borderColor: "rgba(40,122,85,0.6)" }}
            >
              <Check className="w-7 h-7 text-[#287A55]" strokeWidth={3} />
            </motion.span>
            <h4 className="text-[17px] font-bold text-[#312B1E] mt-4 text-center">Link created</h4>
            <p className="text-[12px] text-[#8D8476] mt-1.5 text-center">Share it anywhere — recipients can pay instantly.</p>

            <div className="mt-5 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF]">
              <div className="flex justify-between px-4 py-2.5 text-[12px]">
                <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Amount</span>
                <span className="font-mono font-semibold text-[#312B1E] tabular-nums">{parseFloat(amount).toLocaleString()} {currency}</span>
              </div>
              {description && (
                <div className="flex justify-between px-4 py-2.5 text-[12px]">
                  <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">For</span>
                  <span className="font-semibold text-[#51483A]">{description}</span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[12px] border border-[#EED7C7] bg-gradient-to-br from-[#FFF7F0] to-[#FFFDF9] p-3">
              <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Share link</div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 font-mono text-[11px] text-[#51483A] truncate bg-white/60 rounded-[8px] px-2.5 py-2 border border-[#E8E0D4]">
                  {createdLink}
                </div>
                <button onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[11px] font-bold transition-colors"
                  style={{ backgroundColor: ACCENT, color: "white" }}>
                  {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            </div>

            <button onClick={handleDone}
              className="mt-5 w-full bg-[#312B1E] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Inline error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E7C9BF] bg-[#F9ECE9] px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-[#A84B3D] flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-[12px] leading-[1.5] text-[#A84B3D] font-semibold">{error}</p>
                <button type="button" onClick={() => setError(null)} className="text-[#A84B3D] hover:text-[#7C3328]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* WIC AI draft */}
            <div className="rounded-[14px] bg-[#312B1E] p-4">
              <div className="flex items-center gap-2 mb-3">
                <WicStar className="w-4 h-4 text-[#F1622C]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-[0.1em]">Describe it — WIC fills the form</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={aiText} onChange={(e) => setAiText(e.target.value)}
                  placeholder='e.g. "Invoice Global Reach $1,200 for the March design sprint"'
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-[12px] text-white placeholder:text-[#9C9488] outline-none focus:border-[#F1622C]/60 transition-all"
                />
                <button type="button" onClick={handleAiFill}
                  disabled={isAiFilling || !aiText.trim()}
                  className="shrink-0 flex items-center gap-1.5 bg-[#F1622C] hover:bg-[#E0531C] disabled:opacity-40 text-white px-3 py-2.5 rounded-[10px] text-[11px] font-bold transition-all">
                  {isAiFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WicStar className="w-3.5 h-3.5" />} Fill
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#F1EADF]" />
              <span className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">or manually</span>
              <div className="h-px flex-1 bg-[#F1EADF]" />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Pro Plan Subscription" className={`${inputCls} mt-1.5`} />
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <label className={labelCls}>Amount</label>
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className={`${inputCls} mt-1.5 font-mono tabular-nums`} />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputCls} mt-1.5 cursor-pointer`}>
                  {currencies.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3"
              style={{ backgroundColor: ACCENT_SOFT, borderColor: `${ACCENT}33` }}>
              <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ACCENT } as any} />
              <p className="text-[11.5px] leading-relaxed" style={{ color: ACCENT }}>
                Recipients can pay instantly without a Wireways account — any card, any currency.
              </p>
            </div>

            <button type="submit" disabled={saving || !amount}
              className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-[12px] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-40 shadow-[0_6px_16px_rgba(185,138,46,0.25)]"
              style={{ background: ACCENT }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Create link
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}