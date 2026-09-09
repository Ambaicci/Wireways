"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, AlertTriangle, Check, X, ArrowRight, 
  Repeat, Plus, Link2, CalendarClock, Zap, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { confirmAiDraft } from "@/lib/actions";
import { formatCurrency } from "@/lib/constants";
import WicIcon from "@/components/ui/WicIcon";

interface DraftData {
  uuid: string;
  actionType: string;
  payload: any;
  expiresAt: string;
  message?: string;
  requiresConfirmation?: boolean;
  confirmationReason?: string;
}

const ACTION_META: Record<string, { verb: string; accent: string; soft: string; cta: string; icon: any }> = {
  executePayment: { verb: "Send Payment", accent: "#F1622C", soft: "rgba(241,98,44,0.1)", cta: "Confirm & Send", icon: Zap },
  executeConversionAndPayment: { verb: "Currency Conversion", accent: "#4C5C88", soft: "rgba(76,92,136,0.1)", cta: "Confirm Conversion", icon: Repeat },
  addFunds: { verb: "Add Funds", accent: "#287A55", soft: "rgba(40,122,85,0.1)", cta: "Confirm Top-up", icon: Plus },
  createPaymentLink: { verb: "Payment Request", accent: "#9C6B08", soft: "rgba(156,107,8,0.1)", cta: "Generate Link", icon: Link2 },
  createWireRoll: { verb: "Recurring Payment", accent: "#4C5C88", soft: "rgba(76,92,136,0.1)", cta: "Schedule Wire-Roll", icon: CalendarClock },
};

const REASONING_STEPS = [
  "Parsing natural language...",
  "Identifying intent and entities...",
  "Checking wallet balances and guardrails...",
  "Drafting secure action..."
];

export default function AiCommandBar() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant" | "success"; text: string }[]>([]);
  const [reasoningIndex, setReasoningIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const reasoningInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const engaged = focused || input.trim().length > 0 || isProcessing || !!toastMsg || !!draft || messages.length > 0;

  const showToast = (text: string, type: "success" | "error") => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastMsg({ text, type });
    toastTimeout.current = setTimeout(() => setToastMsg(null), 5000);
  };

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isProcessing, draft]);

  useEffect(() => {
    if (isProcessing) {
      setReasoningIndex(0);
      reasoningInterval.current = setInterval(() => {
        setReasoningIndex((prev) => (prev < REASONING_STEPS.length - 1 ? prev + 1 : prev));
      }, 600);
    } else {
      if (reasoningInterval.current) clearInterval(reasoningInterval.current);
    }
    return () => { if (reasoningInterval.current) clearInterval(reasoningInterval.current); };
  }, [isProcessing]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { 
        e.preventDefault(); 
        textareaRef.current?.focus(); 
      }
      if (e.key === "Escape" && engaged && !isProcessing) {
        handleClear();
        setFocused(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [engaged, isProcessing]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail) {
        setInput(detail);
        setTimeout(() => textareaRef.current?.focus(), 50);
      } else {
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("prefill-ai-dock", handler);
    return () => window.removeEventListener("prefill-ai-dock", handler);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const handleFocus = () => { if (blurTimeout.current) clearTimeout(blurTimeout.current); setFocused(true); };
  const handleBlur = () => { blurTimeout.current = setTimeout(() => setFocused(false), 300); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiRequest(); }
  };

  const handleAiRequest = async (promptText?: string) => {
    const finalInput = promptText || input;
    if (!finalInput.trim() || isProcessing) return;

    setMessages(prev => [...prev, { role: "user", text: finalInput }]);
    setInput("");
    setIsProcessing(true);
    setDraft(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalInput }),
      });
      const data = await response.json();
      if (data.success && data.draft) {
        setDraft(data.draft);
        setMessages(prev => [...prev, { role: "assistant", text: data.draft.message || "Draft prepared and ready for your review." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: data.message || "I couldn't understand that request. Please try rephrasing." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having trouble connecting to the WIC engine right now." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecute = async () => {
    if (!draft) return;
    setIsExecuting(true);
    try {
      const result = await confirmAiDraft(draft.uuid);
      if (result?.success) {
        showToast((draft.message || "Action") + " executed successfully.", "success");
        setMessages(prev => [...prev, { role: "success", text: "Transaction completed successfully." }]);
        router.refresh();
      } else {
        showToast(result?.message || "Execution failed. Please check your balance or try again.", "error");
      }
    } catch {
      showToast("Execution failed. Please try again.", "error");
    } finally {
      setIsExecuting(false);
      setDraft(null);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setDraft(null);
    setToastMsg(null);
    setInput("");
  };

  const meta = ACTION_META[draft?.actionType || "executePayment"] || ACTION_META.executePayment;
  const ActionIcon = meta.icon;
  const p = draft?.payload || {};
  const isRateMissing = p.fromCurrency && p.toCurrency && p.fromCurrency !== p.toCurrency && (!p.rate || p.rate === 1);

  return (
    <>
      {/* ─── CRISP DIM BACKDROP ────── */}
      <AnimatePresence>
        {engaged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => {
              if (!isProcessing && !draft) {
                handleClear();
                setFocused(false);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── MAIN DOCK CARD ────── */}
      <motion.div
        layout
        className="w-full bg-white rounded-t-[28px] rounded-b-none shadow-[0_-10px_50px_rgba(0,0,0,0.08)] border-t border-x border-[#E5E5EA] overflow-hidden relative z-50"
        initial={false}
        animate={{ scale: engaged ? 1 : 0.98, opacity: engaged ? 1 : 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
      >
        <AnimatePresence>
          {(messages.length > 0 || isProcessing) && (
            <motion.div
              ref={chatScrollRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", maxHeight: 450, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="overflow-y-auto border-b border-[#E5E5EA] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative bg-[#FAFAFA]"
            >
              {messages.length > 0 && !isProcessing && !draft && (
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors z-10"
                  title="Clear conversation (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
              <div className="p-5 space-y-4">
                {messages.map((m, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div className={"max-w-[85%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed " + (
                      m.role === "user" ? "bg-[#F1622C] text-white rounded-br-md" :
                      m.role === "success" ? "bg-[#E7F2EC] text-[#287A55] rounded-bl-md" :
                      "bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-md"
                    )}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {/* Intelligent Reasoning State */}
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col gap-3 px-1"
                  >
                    <div className="flex items-center gap-3">
                      <WicIcon className="w-7 h-7 text-[#F1622C] animate-pulse" />
                      <span className="text-[14px] text-[#1D1D1F] font-semibold tracking-tight">WIC is reasoning</span>
                    </div>
                    <div className="space-y-1.5 pl-10">
                      {REASONING_STEPS.map((step, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: idx <= reasoningIndex ? 1 : 0.3, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-2 text-[12px]"
                        >
                          {idx < reasoningIndex ? (
                            <Check className="w-3.5 h-3.5 text-[#287A55]" />
                          ) : idx === reasoningIndex ? (
                            <Loader2 className="w-3.5 h-3.5 text-[#F1622C] animate-spin" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-[#E5E5EA]" />
                          )}
                          <span className={idx <= reasoningIndex ? "text-[#1D1D1F]" : "text-[#86868B]"}>
                            {step}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Secure Draft Confirmation Card (Apple-like Design) */}
                {draft && !isProcessing && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="bg-[#F5F5F7] rounded-[24px] border border-[#E5E5EA] shadow-sm overflow-hidden my-1"
                  >
                    {/* Header */}
                    <div className="px-5 pt-5 pb-3 flex items-center gap-3.5 bg-white rounded-t-[24px]">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.soft }}>
                        <ActionIcon className="w-5 h-5" style={{ color: meta.accent }} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block mb-0.5">{meta.verb}</span>
                        <span className="text-[14px] font-bold text-[#1D1D1F] tracking-tight">Pending Confirmation</span>
                      </div>
                    </div>

                    {/* Guardrail Warning */}
                    {draft.requiresConfirmation && (
                      <div className="mx-4 mt-4 px-3.5 py-2.5 rounded-xl bg-[#FFF8E1] border border-[#FFE082] flex items-start gap-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F57F17] mt-0.5 flex-shrink-0" />
                        <p className="text-[12px] text-[#1D1D1F] leading-relaxed">
                          <span className="font-semibold text-[#F57F17]">Security Check:</span> {draft.confirmationReason}
                        </p>
                      </div>
                    )}

                    {/* Transaction Details */}
                    <div className="px-5 pb-5 pt-4">
                      {draft.actionType === "executeConversionAndPayment" ? (
                        // CONVERSION LAYOUT
                        <div className="flex items-center gap-2 my-2">
                          <div className="flex-1 bg-white rounded-2xl p-4 text-center shadow-sm border border-[#E5E5EA]">
                            <p className="text-[9px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5">You Send</p>
                            <p className="text-[17px] font-bold text-[#1D1D1F] tracking-tight">{formatCurrency(p.amount, p.fromCurrency)}</p>
                          </div>
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F1622C] flex items-center justify-center shadow-sm z-10">
                            <ArrowRight className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 bg-white rounded-2xl p-4 text-center shadow-sm border border-[#E5E5EA]">
                            <p className="text-[9px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5">You Get</p>
                            {isRateMissing ? (
                              <p className="text-[12px] font-semibold text-[#F57F17] flex items-center justify-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                              </p>
                            ) : (
                              <p className="text-[17px] font-bold text-[#1D1D1F] tracking-tight">{formatCurrency(p.amount * p.rate, p.toCurrency)}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        // SEND MONEY LAYOUT
                        <div className="flex flex-col items-center py-2 bg-white rounded-2xl border border-[#E5E5EA] shadow-sm">
                          <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1 mt-2">You're sending</p>
                          <p className="text-[22px] font-bold text-[#1D1D1F] tracking-tight mb-4">{formatCurrency(p.amount, p.currency || "USD")}</p>
                          
                          <div className="w-px h-4 bg-[#E5E5EA] mb-4" />
                          
                          <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">To</p>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-[#F1622C]/10 flex items-center justify-center text-[#F1622C] font-bold text-[13px]">
                              {p.recipient ? p.recipient.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-[14px] font-semibold text-[#1D1D1F]">{p.recipient || 'Unknown'}</span>
                          </div>

                          {/* Clean Details Rows */}
                          <div className="w-full px-4 pb-4 space-y-1.5">
                            {p.rail && p.rail !== "Auto" && (
                              <div className="flex justify-between items-center px-3 py-2 bg-[#F5F5F7] rounded-lg">
                                <span className="text-[11px] text-[#86868B]">Rail</span>
                                <span className="text-[12px] font-semibold text-[#1D1D1F]">{p.rail}</span>
                              </div>
                            )}
                            {p.description && (
                              <div className="flex justify-between items-center px-3 py-2 bg-[#F5F5F7] rounded-lg">
                                <span className="text-[11px] text-[#86868B]">Note</span>
                                <span className="text-[12px] font-semibold text-[#1D1D1F] text-right max-w-[60%] truncate">{p.description}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 pb-5 pt-1 flex gap-2.5">
                      <button 
                        onClick={() => { setDraft(null); setMessages(prev => [...prev, { role: "assistant", text: "Cancelled. What else can I help with?" }]); }} 
                        disabled={isExecuting}
                        className="flex-1 py-3.5 rounded-xl text-[13px] font-semibold text-[#0071E3] bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleExecute} 
                        disabled={isExecuting}
                        className="flex-[2] py-3.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: draft.requiresConfirmation ? "#F57F17" : meta.accent }}
                      >
                        {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {draft.requiresConfirmation ? "Yes, I'm Sure" : meta.cta}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end gap-3 p-4 bg-white">
          <div className="pb-2 flex-shrink-0">
            <WicIcon className="w-8 h-8 text-[#F1622C]" />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Ask WIC... (e.g., 'Send 50 USD to John')"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] py-2 leading-relaxed max-h-[120px] font-medium tracking-tight"
          />
          <button
            onClick={() => handleAiRequest()}
            disabled={!input.trim() || isProcessing}
            className="w-10 h-10 rounded-xl bg-[#F1622C] flex items-center justify-center text-white hover:bg-[#D4511E] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-sm mb-0.5"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Toast Notifications */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="border-t border-[#E5E5EA] px-5 py-3.5 flex items-start gap-3 bg-[#FAFAFA]"
            >
              <div className={"shrink-0 w-6 h-6 rounded-full flex items-center justify-center " + (toastMsg.type === "error" ? "bg-[#FEE2E2]" : "bg-[#E7F2EC]")}>
                {toastMsg.type === "error" ? <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" /> : <Check className="w-3.5 h-3.5 text-[#287A55]" strokeWidth={3} />}
              </div>
              <p className={"flex-1 text-[13px] leading-relaxed font-medium " + (toastMsg.type === "error" ? "text-[#DC2626]" : "text-[#287A55]")}>
                {toastMsg.text}
              </p>
              <button onClick={() => setToastMsg(null)} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}