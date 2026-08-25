"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, AlertTriangle, Check, X,
  ArrowRight, ArrowUpRight, Repeat, Plus, Link2, CalendarClock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  executePayment, executeConversionAndPayment, addFunds,
  createPaymentLink, createWireRoll,
} from "@/lib/actions";

interface DraftData {
  uuid: string;
  actionType: string;
  payload: any;
  expiresAt: string;
  message?: string;
  requiresConfirmation?: boolean;
  confirmationReason?: string;
}

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", USDC: "$", KES: "KSh " };

function fmtMoney(amount: any, currency: string) {
  const n = Number(amount);
  if (isNaN(n)) return String(amount);
  return `${CURRENCY_SYMBOL[currency] ?? currency + " "}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function calculateNextRun(freq: string): string {
  const d = new Date();
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "biweekly") d.setDate(d.getDate() + 14);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const ACTION_META: Record<string, { verb: string; accent: string; soft: string; cta: string }> = {
  executePayment: { verb: "Sending", accent: "#F1622C", soft: "rgba(241,98,44,0.14)", cta: "Execute transfer" },
  executeConversionAndPayment: { verb: "Converting", accent: "#7C8DB5", soft: "rgba(124,141,181,0.14)", cta: "Execute conversion" },
  addFunds: { verb: "Adding funds", accent: "#287A55", soft: "rgba(40,122,85,0.14)", cta: "Add funds" },
  createPaymentLink: { verb: "Requesting", accent: "#B98A2E", soft: "rgba(185,138,46,0.14)", cta: "Create link" },
  createWireRoll: { verb: "Scheduling", accent: "#7C8DB5", soft: "rgba(124,141,181,0.14)", cta: "Create wire-roll" },
};

const ACTION_ICON: Record<string, any> = {
  executePayment: ArrowUpRight,
  executeConversionAndPayment: Repeat,
  addFunds: Plus,
  createPaymentLink: Link2,
  createWireRoll: CalendarClock,
};

export default function AiCommandBar() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant" | "success"; text: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); textareaRef.current?.focus(); }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      setInput(detail);
      textareaRef.current?.focus();
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
  const handleBlur = () => { blurTimeout.current = setTimeout(() => setFocused(false), 200); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiRequest(); }
  };

  const handleAiRequest = async (promptText?: string) => {
    const finalInput = promptText || input;
    if (!finalInput.trim() || isProcessing) return;

    setMessages(prev => [...prev, { role: "user", text: finalInput }]);
    setInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalInput }),
      });
      const data = await response.json();
      if (data.success && data.draft) {
        setDraft(data.draft);
        setMessages(prev => [...prev, { role: "assistant", text: data.draft.message || "Draft prepared." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: data.message || "I couldn't understand that request." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having trouble connecting right now." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecute = async () => {
    if (!draft) return;
    setIsExecuting(true);
    let result;

    try {
      if (draft.actionType === "executePayment") result = await executePayment(draft.payload);
      else if (draft.actionType === "executeConversionAndPayment") result = await executeConversionAndPayment(draft.payload);
      else if (draft.actionType === "addFunds") result = await addFunds(draft.payload);
      else if (draft.actionType === "createPaymentLink") result = await createPaymentLink(draft.payload);
      else if (draft.actionType === "createWireRoll") {
        result = await createWireRoll({
          name: draft.payload.description || `Recurring to ${draft.payload.recipient}`,
          recipient: draft.payload.recipient,
          amount: draft.payload.amount,
          currency: draft.payload.currency,
          frequency: draft.payload.frequency,
          rail: draft.payload.rail || "Auto",
          nextRunDate: calculateNextRun(draft.payload.frequency),
        });
      }
    } catch (err: any) {
      result = { success: false, message: err.message || "Execution failed" };
    }

    if (result?.success) {
      showToast(`${draft.message || "Action"} executed successfully.`, "success");
      setMessages(prev => [...prev, { role: "success", text: "Executed successfully." }]);
      router.refresh();
    } else {
      showToast(result?.message || "Execution failed", "error");
    }
    setDraft(null);
    setIsExecuting(false);
  };

   const handleCancel = () => {
    setDraft(null);
    setMessages(prev => [...prev, { role: "assistant", text: "Cancelled. What would you like to do instead?" }]);
  };

  const handleClear = () => {
    setMessages([]);
    setDraft(null);
    setToastMsg(null);
  };

  const payloadEntries = draft ? Object.entries(draft.payload || {}) : [];
  const meta = ACTION_META[draft?.actionType || "executePayment"] || ACTION_META.executePayment;
  const ActionIcon = ACTION_ICON[draft?.actionType || "executePayment"] || ArrowUpRight;
  const p = draft?.payload || {};
  const isConvert = draft?.actionType === "executeConversionAndPayment";
  const prettyKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-5 px-4">
      <div className="w-full max-w-[640px] pointer-events-auto flex flex-col items-center">
        {/* Dock shell — same warm brown as the Briefing card */}
        <motion.div
          layout
          className="w-full bg-[#312B1E] rounded-[24px] shadow-[0_24px_70px_rgba(24,19,14,0.45)] border border-white/10 overflow-hidden"
          initial={false}
          animate={{ scale: engaged ? 1 : 0.98, opacity: engaged ? 1 : 0.96 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
        >
          {/* Conversation + receipt */}
                   <AnimatePresence>
            {(messages.length > 0 || isProcessing) && (
              <motion.div
                ref={chatScrollRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", maxHeight: 400, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-y-auto border-b border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative"
              >
                {/* Clear button */}
                {messages.length > 0 && !isProcessing && (
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9C9488] hover:text-white transition-colors z-10"
                    title="Clear conversation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="p-4 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        m.role === "user" ? "bg-[#F1622C] text-white rounded-br-md" :
                        m.role === "success" ? "bg-[#287A55]/20 text-[#8FD0AE] border border-[#287A55]/40" :
                        "bg-white/10 text-[#EDE7DC] rounded-bl-md"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {/* WIC thinking — the three dancing dots */}
                  {isProcessing && (
                    <div className="flex items-center gap-2.5 px-1">
                      <span className="text-[12px] text-[#C6BFB3] font-medium">WIC is thinking</span>
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#F1622C] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adaptive receipt */}
                  {draft && (
                    <motion.div
                      initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                      className="rounded-2xl border bg-[#2A2418] overflow-hidden"
                      style={{ borderColor: draft.requiresConfirmation ? "#B98A2E" : `${meta.accent}66` }}
                    >
                      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2.5" style={{ backgroundColor: meta.soft }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.accent }}>
                          <ActionIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[13px] font-bold text-white">{meta.verb}…</span>
                      </div>

                      {draft.requiresConfirmation && (
                        <div className="px-4 py-3 bg-[#B98A2E]/15 border-b border-[#B98A2E]/30 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-[#B98A2E] mt-0.5 flex-shrink-0" />
                          <p className="text-[12px] text-[#EFE9DD] leading-relaxed">
                            <span className="text-white font-bold">Heads up:</span> {draft.confirmationReason}
                          </p>
                        </div>
                      )}

                      <div className="p-4 space-y-2.5">
                        {isConvert ? (
                          <div className="flex items-center gap-3 text-[13px] text-[#EDE7DC]">
                            <span className="font-mono font-bold">{fmtMoney(p.amount, p.fromCurrency)}</span>
                            <ArrowRight className="w-4 h-4 text-[#9C9488]" />
                            <span className="font-mono font-bold" style={{ color: meta.accent }}>{fmtMoney(p.amount * (p.rate || 1), p.toCurrency)}</span>
                          </div>
                        ) : (
                          payloadEntries.map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center gap-4 text-[12.5px]">
                              <span className="text-[#9C9488] capitalize">{prettyKey(key)}</span>
                              <span className="font-mono font-semibold text-white text-right">
                                {key.toLowerCase().includes("amount") ? fmtMoney(val, p.currency) : String(val)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-3 bg-black/20 flex items-center gap-2">
                        <button onClick={handleCancel} disabled={isExecuting}
                          className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold text-[#EDE7DC] bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50">
                          Cancel
                        </button>
                        <button onClick={handleExecute} disabled={isExecuting}
                          className="flex-[2] py-2.5 rounded-xl text-[12.5px] font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                          style={{ backgroundColor: draft.requiresConfirmation ? "#B98A2E" : meta.accent }}
                        >
                          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : (draft.requiresConfirmation ? <AlertTriangle className="w-4 h-4" /> : <ActionIcon className="w-4 h-4" />)}
                          {draft.requiresConfirmation ? "Yes, I'm sure" : meta.cta}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-3 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Ask WIC… (e.g. 'Send 50 USD to John')"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[14px] text-[#F5EFE6] placeholder:text-[#9C9488] py-2.5 px-3 leading-relaxed"
            />
            <button
              onClick={() => handleAiRequest()}
              disabled={!input.trim() || isProcessing}
              className="w-10 h-10 rounded-xl bg-[#F1622C] flex items-center justify-center text-white hover:bg-[#E0531C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="border-t border-white/10 px-4 py-3 flex items-start gap-2.5"
              >
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${toastMsg.type === "error" ? "bg-[#A84B3D]/25" : "bg-[#287A55]/20"}`}>
                  {toastMsg.type === "error" ? <AlertTriangle className="w-3.5 h-3.5 text-[#E0A196]" /> : <Check className="w-3.5 h-3.5 text-[#7BC49A]" strokeWidth={3} />}
                </div>
                <p className={`flex-1 text-[13px] leading-relaxed ${toastMsg.type === "error" ? "text-[#E7BFB4]" : "text-[#A7D4B8]"}`}>
                  {toastMsg.text}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="hidden md:block mt-2 text-[9px] text-[#9C9488]">
          <span className="border border-white/15 bg-white/5 rounded px-1.5 py-0.5 text-[8px] text-[#C6BFB3]">⌘ K</span> to talk to WIC
        </div>
      </div>
    </div>
  );
}