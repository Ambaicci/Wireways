"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock, Zap, PauseCircle, PlayCircle, Trash2, Plus, X,
  AlertTriangle, CheckCircle2, Loader2, Users, User, Clock,
  ChevronRight, History, Sparkles, Upload, Download, FileText, DollarSign
} from "lucide-react";
import {
  createWireRoll, toggleWireRoll, deleteWireRoll,
  setWireRollAutoRun, executeWireRollRun
} from "@/lib/actions";
import { formatCurrency, SUPPORTED_CURRENCIES, VALID_FREQUENCIES } from "@/lib/constants";

const T = {
  brand: "#F1622C",
  brandDark: "#D4511E",
  green: "#287A55",
  greenWash: "rgba(40,122,85,0.06)",
  red: "#C53030",
  blue: "#4C5C88",
  blueWash: "rgba(76,92,136,0.055)",
  ink: "#1C1917",
  muted: "#A8A29E",
  faint: "#D6D3D1",
  border: "#E7E5E4",
  borderSoft: "#F5F5F4",
  paper: "#F6F5F3",
};

interface WireRoll {
  id: number;
  name: string;
  recipient: string;
  currency: string;
  amount: number;
  frequency: string;
  next_run_date: string;
  rail: string;
  status: string;
  auto_run: number;
  items: { recipient: string; currency: string; amount: number; rail: string }[];
  isBatch: boolean;
  itemCount: number;
  fundingStatus: "funded" | "partial" | "unfunded";
  shortfall: number;
  shortfallCurrency: string;
  lastRun: { status: string; executedAt: string; amount: number } | null;
  history: { status: string; executedAt: string; amount: number; rail: string }[];
}

interface BatchItem {
  recipient: string;
  currency: string;
  amount: string;
  rail: string;
  _error?: string;
  _valid?: boolean;
}

function prefillDock(text: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
  }
}

export default function WireRollPage() {
  const [rolls, setRolls] = useState<WireRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<WireRoll | null>(null);
  const [isExecuting, setIsExecuting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => { fetchRolls(); }, []);

  const fetchRolls = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wire-rolls");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRolls(data.rolls || []);
    } catch (error) {
      console.error("Failed to fetch wire-rolls:", error);
      setRolls([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (roll: WireRoll) => {
    const newStatus = roll.status === "active" ? "paused" : "active";
    const res = await toggleWireRoll({ id: roll.id, status: newStatus });
    if (res.success) {
      setRolls(prev => prev.map(r => r.id === roll.id ? { ...r, status: newStatus } : r));
      if (selectedRoll?.id === roll.id) setSelectedRoll({ ...roll, status: newStatus });
      showToast(newStatus === "active" ? "Wire-roll resumed." : "Wire-roll paused.", "success");
    } else {
      showToast(res.message || "Failed to update.", "error");
    }
  };

  const handleToggleAutoRun = async (roll: WireRoll) => {
    const newAuto = roll.auto_run === 1 ? false : true;
    const res = await setWireRollAutoRun({ id: roll.id, autoRun: newAuto });
    if (res.success) {
      setRolls(prev => prev.map(r => r.id === roll.id ? { ...r, auto_run: newAuto ? 1 : 0 } : r));
      if (selectedRoll?.id === roll.id) setSelectedRoll({ ...roll, auto_run: newAuto ? 1 : 0 });
      showToast(newAuto ? "Auto-run armed." : "Auto-run disabled.", "success");
    } else {
      showToast(res.message || "Failed to update.", "error");
    }
  };

  const handleDelete = async (roll: WireRoll) => {
    if (!confirm(`Delete "${roll.name}"? This cannot be undone.`)) return;
    const res = await deleteWireRoll(roll.id);
    if (res.success) {
      setRolls(prev => prev.filter(r => r.id !== roll.id));
      setSelectedRoll(null);
      showToast("Wire-roll deleted.", "success");
    } else {
      showToast(res.message || "Failed to delete.", "error");
    }
  };

  const handleExecute = async (roll: WireRoll) => {
    if (roll.fundingStatus === "unfunded") {
      if (!confirm(`⚠️ This wire-roll is underfunded by ${formatCurrency(roll.shortfall, roll.shortfallCurrency)}. Execute anyway?`)) return;
    } else {
      if (!confirm(`Execute "${roll.name}" now?`)) return;
    }
    setIsExecuting(roll.id);
    const res = await executeWireRollRun(roll.id);
    setIsExecuting(null);
    if (res.success) {
      showToast(`"${roll.name}" executed successfully.`, "success");
      fetchRolls();
    } else {
      showToast(res.message || "Execution failed.", "error");
    }
  };

  const handleCreated = async () => {
    setIsCreateOpen(false);
    showToast("Wire-roll created successfully.", "success");
    await fetchRolls();
  };

  const activeRolls = rolls.filter(r => r.status === "active").length;
  const fundedRolls = rolls.filter(r => r.fundingStatus === "funded").length;
  const unfundedRolls = rolls.filter(r => r.fundingStatus === "unfunded").length;

  return (
    <div className="min-h-screen bg-[#F6F5F3] pb-36">
      <main className="max-w-[1120px] mx-auto px-6 pt-8 pb-7 space-y-5">
        
        {/* ─── Header ─────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-[800] tracking-[-0.03em] text-[#1C1917]">Wire-rolls</h1>
            <p className="text-[13px] text-[#A8A29E] mt-1">Standing orders, payroll, and automated recurring payments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => prefillDock("Create a new wire-roll for ")}
              className="px-4 py-2.5 bg-[#1C1917] text-white rounded-xl text-[13px] font-semibold hover:bg-black transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#F1622C]" /> Ask WIC
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 bg-[#F1622C] text-white rounded-xl text-[13px] font-semibold hover:bg-[#D4511E] transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Wire-roll
            </button>
          </div>
        </header>

        {/* ─── Summary Stats ──────────────────────────────── */}
        {rolls.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Total</p>
              <p className="text-[24px] font-[800] text-[#1C1917] tabular-nums">{rolls.length}</p>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Active</p>
              <p className="text-[24px] font-[800] text-[#287A55] tabular-nums">{activeRolls}</p>
            </div>
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Funded</p>
              <p className="text-[24px] font-[800] text-[#287A55] tabular-nums">{fundedRolls}</p>
            </div>
            <div className={`border rounded-xl p-4 ${unfundedRolls > 0 ? "bg-[#C53030]/5 border-[#C53030]/20" : "bg-white border-[#E7E5E4]"}`}>
              <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Underfunded</p>
              <p className={`text-[24px] font-[800] tabular-nums ${unfundedRolls > 0 ? "text-[#C53030]" : "text-[#1C1917]"}`}>{unfundedRolls}</p>
            </div>
          </div>
        )}

        {/* ─── WIC Suggestions ────────────────────────────── */}
        {!loading && (
          <WicSuggestions 
            onDismiss={fetchRolls} 
            onCreateRoll={() => setIsCreateOpen(true)}
          />
        )}

        {/* ─── Loading ────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-16 text-center">
            <Loader2 className="w-8 h-8 text-[#F1622C] animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-[#A8A29E]">Loading wire-rolls...</p>
          </div>
        ) : rolls.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-16 text-center">
            <div className="w-14 h-14 mx-auto bg-[#F6F5F3] rounded-2xl flex items-center justify-center mb-4">
              <CalendarClock className="w-6 h-6 text-[#A8A29E]" />
            </div>
            <h2 className="text-[17px] font-[600] text-[#1C1917] mb-1">No scheduled payments</h2>
            <p className="text-[13px] text-[#A8A29E] max-w-[340px] mx-auto mb-5">
              Create a standing order, set up payroll, or ask WIC to schedule one for you.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => prefillDock("Create a monthly wire-roll of $500 USD to John Kamau")}
                className="px-5 py-2.5 bg-[#1C1917] text-white rounded-xl text-[13px] font-semibold hover:bg-black transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#F1622C]" /> Ask WIC
              </button>
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-[#F1622C] text-white rounded-xl text-[13px] font-semibold hover:bg-[#D4511E] transition-colors"
              >
                Create manually
              </button>
            </div>
          </div>
        ) : (
          /* ─── Roll List ──────────────────────────────────── */
          <div className="bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden shadow-sm">
            {rolls.map((r, i) => {
              const isActive = r.status === "active";
              const isAuto = r.auto_run === 1;
              const totalAmount = r.isBatch 
                ? r.items.reduce((sum, it) => sum + Number(it.amount), 0)
                : Number(r.amount);
              const displayCurrency = r.isBatch ? r.items[0]?.currency || "USD" : r.currency;
              
              return (
                <div 
                  key={r.id} 
                  className={`p-5 hover:bg-[#FAFAFA] transition-colors group cursor-pointer ${i > 0 ? "border-t border-[#F5F5F4]" : ""}`}
                  onClick={() => setSelectedRoll(r)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-[#F1622C]/10" : "bg-[#F5F5F4]"}`}>
                        {r.isBatch ? (
                          <Users className={`w-5 h-5 ${isActive ? "text-[#F1622C]" : "text-[#A8A29E]"}`} />
                        ) : (
                          <User className={`w-5 h-5 ${isActive ? "text-[#F1622C]" : "text-[#A8A29E]"}`} />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-[14px] font-[600] text-[#1C1917] truncate">{r.name}</h3>
                          {r.fundingStatus === "funded" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#287A55]/10 text-[#287A55] text-[9px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Funded
                            </span>
                          )}
                          {r.fundingStatus === "unfunded" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C53030]/10 text-[#C53030] text-[9px] font-bold uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5" /> Short {formatCurrency(r.shortfall, r.shortfallCurrency)}
                            </span>
                          )}
                          {r.isBatch && (
                            <span className="px-2 py-0.5 rounded-md bg-[#4C5C88]/10 text-[#4C5C88] text-[9px] font-bold uppercase tracking-wider">
                              {r.itemCount} recipients
                            </span>
                          )}
                          {isAuto && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#287A55]/10 text-[#287A55] text-[9px] font-bold uppercase tracking-wider">
                              <Zap className="w-2.5 h-2.5" /> Auto
                            </span>
                          )}
                          {!isActive && (
                            <span className="px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#A8A29E] text-[9px] font-bold uppercase tracking-wider">Paused</span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#A8A29E] mt-0.5 truncate">
                          {r.isBatch 
                            ? `Batch payment · ${r.frequency} · via ${r.rail || "Auto"}`
                            : `To ${r.recipient} · ${r.frequency} · via ${r.rail || "Auto"}`
                          }
                        </p>
                        {r.lastRun && (
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-[#A8A29E]">
                            <Clock className="w-3 h-3" />
                            <span>Last: {new Date(r.lastRun.executedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} {r.lastRun.status === "completed" ? "✅" : "❌"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[14px] font-[700] text-[#1C1917] tabular-nums">{formatCurrency(totalAmount, displayCurrency)}</p>
                        <p className="text-[11px] text-[#A8A29E] mt-0.5">
                          Next: {new Date(r.next_run_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#D6D3D1] group-hover:text-[#A8A29E] transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Detail Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedRoll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-5"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
            onClick={() => setSelectedRoll(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-[24px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-[#F5F5F4] px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedRoll.status === "active" ? "bg-[#F1622C]/10" : "bg-[#F5F5F4]"}`}>
                    {selectedRoll.isBatch ? <Users className="w-4 h-4 text-[#F1622C]" /> : <User className="w-4 h-4 text-[#F1622C]" />}
                  </div>
                  <h2 className="text-[17px] font-[600] text-[#1C1917]">{selectedRoll.name}</h2>
                </div>
                <button onClick={() => setSelectedRoll(null)} className="w-7 h-7 rounded-lg bg-[#F5F5F4] flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                    selectedRoll.status === "active" ? "bg-[#287A55]/10 text-[#287A55]" : "bg-[#F5F5F4] text-[#A8A29E]"
                  }`}>{selectedRoll.status}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                    selectedRoll.fundingStatus === "funded" ? "bg-[#287A55]/10 text-[#287A55]" : "bg-[#C53030]/10 text-[#C53030]"
                  }`}>
                    {selectedRoll.fundingStatus === "funded" ? "✅ Fully Funded" : `⚠️ Short ${formatCurrency(selectedRoll.shortfall, selectedRoll.shortfallCurrency)}`}
                  </span>
                  {selectedRoll.auto_run === 1 && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#287A55]/10 text-[#287A55]">⚡ Auto-run</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#F6F5F3] rounded-xl">
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-[16px] font-[700] text-[#1C1917] tabular-nums">
                      {formatCurrency(
                        selectedRoll.isBatch ? selectedRoll.items.reduce((s, it) => s + Number(it.amount), 0) : Number(selectedRoll.amount),
                        selectedRoll.isBatch ? selectedRoll.items[0]?.currency || "USD" : selectedRoll.currency
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-[#F6F5F3] rounded-xl">
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Frequency</p>
                    <p className="text-[16px] font-[700] text-[#1C1917] capitalize">{selectedRoll.frequency}</p>
                  </div>
                  <div className="p-3 bg-[#F6F5F3] rounded-xl">
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Next Run</p>
                    <p className="text-[16px] font-[700] text-[#1C1917]">
                      {new Date(selectedRoll.next_run_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="p-3 bg-[#F6F5F3] rounded-xl">
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Rail</p>
                    <p className="text-[16px] font-[700] text-[#1C1917]">{selectedRoll.rail || "Auto"}</p>
                  </div>
                </div>

                {selectedRoll.isBatch && selectedRoll.items.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-[600] text-[#1C1917] mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#4C5C88]" /> Recipients ({selectedRoll.items.length})
                    </h3>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {selectedRoll.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#F6F5F3] rounded-xl">
                          <span className="text-[13px] font-[600] text-[#1C1917]">{it.recipient}</span>
                          <span className="text-[13px] font-[700] text-[#1C1917] tabular-nums">{formatCurrency(it.amount, it.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedRoll.isBatch && (
                  <div className="p-3 bg-[#F6F5F3] rounded-xl">
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">Recipient</p>
                    <p className="text-[14px] font-[600] text-[#1C1917]">{selectedRoll.recipient}</p>
                  </div>
                )}

                {selectedRoll.history && selectedRoll.history.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-[600] text-[#1C1917] mb-3 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#4C5C88]" /> Recent Executions
                    </h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedRoll.history.map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#F6F5F3] rounded-xl">
                          <div className="flex items-center gap-2">
                            {h.status === "completed" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#287A55]" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#C53030]" />
                            )}
                            <span className="text-[12px] text-[#1C1917]">
                              {new Date(h.executedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          <span className="text-[12px] font-[600] text-[#1C1917] tabular-nums capitalize">{h.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => handleExecute(selectedRoll)}
                    disabled={isExecuting === selectedRoll.id || selectedRoll.status !== "active"}
                    className="flex-1 py-3 rounded-xl bg-[#F1622C] text-white text-[13px] font-semibold hover:bg-[#D4511E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isExecuting === selectedRoll.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Execute Now
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(selectedRoll)}
                    className="py-3 px-4 rounded-xl border border-[#E7E5E4] text-[13px] font-semibold text-[#57534E] hover:bg-[#F5F5F4] transition-colors flex items-center gap-2"
                  >
                    {selectedRoll.status === "active" ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    {selectedRoll.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedRoll)}
                    className="py-3 px-4 rounded-xl border border-[#E7E5E4] text-[13px] font-semibold text-[#C53030] hover:bg-[#C53030]/5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Create Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreateWireRollModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>

      {/* ─── Toast ────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border"
            style={{ backgroundColor: "#fff", borderColor: toast.type === "success" ? "rgba(40,122,85,0.3)" : "rgba(197,48,48,0.3)" }}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-[#287A55]" /> : <AlertTriangle className="w-4 h-4 text-[#C53030]" />}
            <span className="text-[13px] font-medium text-[#1C1917]">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WIC SUGGESTIONS COMPONENT
// ════════════════════════════════════════════════════════════

function WicSuggestions({ onDismiss, onCreateRoll }: { onDismiss: () => void; onCreateRoll: () => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wic/suggestions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    try {
      await fetch("/api/wic/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId }),
      });
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      onDismiss();
    } catch (error) {
      console.error("Failed to dismiss suggestion:", error);
    }
  };

  const handleCreateFromSuggestion = (suggestion: any) => {
    onCreateRoll();
    // Prefill logic can be added here later via window events or state
  };

  if (loading) return null;
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-[#F1622C]/5 to-[#F1622C]/10 border border-[#F1622C]/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#F1622C]" />
        <h2 className="text-[16px] font-[700] text-[#1C1917]">WIC Detected Patterns</h2>
        <span className="text-[10px] font-bold text-[#F1622C] bg-[#F1622C]/10 px-2 py-0.5 rounded-full">
          {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {suggestions.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-4 border border-[#E7E5E4] hover:border-[#F1622C]/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-[600] text-[#1C1917] capitalize">{s.recipient}</span>
                  <span className="text-[10px] font-bold text-[#4C5C88] bg-[#4C5C88]/10 px-1.5 py-0.5 rounded uppercase">
                    {s.suggestedFrequency}
                  </span>
                  <span className="text-[10px] font-bold text-[#287A55] bg-[#287A55]/10 px-1.5 py-0.5 rounded">
                    {s.confidence}% confident
                  </span>
                </div>
                <p className="text-[12px] text-[#57534E] leading-relaxed mb-2">{s.reason}</p>
                <div className="flex items-center gap-4 text-[11px] text-[#A8A29E]">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Avg: {formatCurrency(s.averageAmount, s.currency)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {s.transactionCount} payments
                  </span>
                  {s.typicalDayOfMonth && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      ~{s.typicalDayOfMonth}{getOrdinalSuffix(s.typicalDayOfMonth)} of month
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDismiss(s.id)}
                  className="w-8 h-8 rounded-lg border border-[#E7E5E4] flex items-center justify-center text-[#A8A29E] hover:text-[#C53030] hover:border-[#C53030]/30 transition-colors"
                  title="Dismiss suggestion"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCreateFromSuggestion(s)}
                  className="px-3 py-2 rounded-lg bg-[#F1622C] text-white text-[12px] font-semibold hover:bg-[#D4511E] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Wire-roll
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// ════════════════════════════════════════════════════════════
// CREATE WIRE-ROLL MODAL (with CSV Import)
// ════════════════════════════════════════════════════════════

function CreateWireRollModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<"standing" | "batch">("standing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [frequency, setFrequency] = useState("monthly");
  const [nextRunDate, setNextRunDate] = useState("");
  const [rail, setRail] = useState("Auto");
  
  const [batchName, setBatchName] = useState("");
  const [batchFrequency, setBatchFrequency] = useState("monthly");
  const [batchNextDate, setBatchNextDate] = useState("");
  const [batchRail, setBatchRail] = useState("Auto");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  
  const [csvPreview, setCsvPreview] = useState<BatchItem[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CSV_TEMPLATE = `name,amount,currency\nJohn Kamau,500.00,USD\nJane Doe,1200.00,EUR`;

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const hasHeader = lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("amount");
      const dataLines = hasHeader ? lines.slice(1) : lines;
      
      const parsed = dataLines.map(line => {
        const fields = line.split(",");
        return {
          recipient: fields[0]?.trim() || "",
          amount: fields[1]?.trim() || "",
          currency: (fields[2]?.trim() || "USD").toUpperCase(),
          rail: "Auto",
        };
      });
             const validated = parsed.map(item => {
        let valid = true;
        let error = "";
        if (!item.recipient) { valid = false; error = "Missing name"; }
        else if (!item.amount || isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) { valid = false; error = "Invalid amount"; }
        else if (!SUPPORTED_CURRENCIES.includes(item.currency as any)) { valid = false; error = "Unsupported currency"; }
        return { ...item, _valid: valid, _error: error };
      });
      setCsvPreview(validated);
    };
  };

  const applyCsvPreview = () => {
    if (!csvPreview) return;
    const validItems = csvPreview.filter(it => it._valid);
    setBatchItems(prev => [...prev, ...validItems.map(it => ({ recipient: it.recipient, amount: it.amount, currency: it.currency, rail: it.rail }))]);
    setCsvPreview(null);
    setCsvFileName("");
  };

  const discardCsvPreview = () => { setCsvPreview(null); setCsvFileName(""); };
  const updateCsvRow = (idx: number, field: keyof BatchItem, value: string) => {
    if (!csvPreview) return;
    const updated = [...csvPreview];
    updated[idx] = { ...updated[idx], [field]: value };
    let valid = true, error = "";
    if (!updated[idx].recipient) { valid = false; error = "Missing name"; }
    else if (!updated[idx].amount || isNaN(parseFloat(updated[idx].amount))) { valid = false; error = "Invalid amount"; }
    updated[idx]._valid = valid;
    updated[idx]._error = error;
    setCsvPreview(updated);
  };
  const removeCsvRow = (idx: number) => { if (csvPreview) setCsvPreview(csvPreview.filter((_, i) => i !== idx)); };

  const addBatchItem = () => setBatchItems([...batchItems, { recipient: "", currency: "USD", amount: "", rail: "Auto" }]);
  const removeBatchItem = (idx: number) => { if (batchItems.length > 0) setBatchItems(batchItems.filter((_, i) => i !== idx)); };
  const updateBatchItem = (idx: number, field: keyof BatchItem, value: string) => setBatchItems(batchItems.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      let payload;
      if (mode === "standing") {
        if (!name || !recipient || !amount || !nextRunDate) throw new Error("Please fill in all required fields.");
        payload = { name: name.trim(), recipient: recipient.trim(), amount: parseFloat(amount), currency, frequency, nextRunDate, rail };
      } else {
        if (!batchName || !batchNextDate) throw new Error("Please fill in the batch name and next run date.");
        if (batchItems.length === 0) throw new Error("Add at least one recipient.");
        const validItems = batchItems.filter(it => it.recipient && it.amount && !isNaN(parseFloat(it.amount)));
        if (validItems.length === 0) throw new Error("All recipients must have a valid name and amount.");
        payload = { name: batchName.trim(), frequency: batchFrequency, nextRunDate: batchNextDate, rail: batchRail, items: validItems.map(it => ({ recipient: it.recipient.trim(), currency: it.currency, amount: parseFloat(it.amount), rail: it.rail })) };
      }
      const res = await createWireRoll(payload);
      if (res.success) { onCreated(); } else { throw new Error(res.message || "Failed to create."); }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "mt-1.5 w-full border border-[#E7E5E4] rounded-xl px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] transition-colors";
  const labelCls = "text-[10px] font-bold text-[#A8A29E] uppercase tracking-[0.1em]";
  const validCount = csvPreview?.filter(it => it._valid).length || 0;
  const invalidCount = csvPreview ? csvPreview.length - validCount : 0;
  const csvTotal = csvPreview?.filter(it => it._valid).reduce((sum, it) => sum + parseFloat(it.amount || "0"), 0) || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-5" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <motion.div initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white rounded-[24px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-[#F5F5F4] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[17px] font-[600] text-[#1C1917]">New Wire-roll</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F5F5F4] flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F5F3] rounded-xl">
            <button onClick={() => setMode("standing")} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${mode === "standing" ? "bg-white text-[#1C1917] shadow-sm" : "text-[#A8A29E]"}`}><User className="w-4 h-4" /> Standing Order</button>
            <button onClick={() => setMode("batch")} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${mode === "batch" ? "bg-white text-[#1C1917] shadow-sm" : "text-[#A8A29E]"}`}><Users className="w-4 h-4" /> Payroll / Batch</button>
          </div>

          {mode === "standing" ? (
            <div className="space-y-4">
              <div><label className={labelCls}>Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John's retainer" className={inputCls} /></div>
              <div><label className={labelCls}>Recipient</label><input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g., John Kamau" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Amount</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} /></div>
                <div><label className={labelCls}>Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls + " bg-white"}>{SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Frequency</label><select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls + " bg-white"}>{VALID_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div><label className={labelCls}>Next Run Date</label><input type="date" value={nextRunDate} onChange={(e) => setNextRunDate(e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Payment Rail</label><select value={rail} onChange={(e) => setRail(e.target.value)} className={inputCls + " bg-white"}><option value="Auto">Auto</option><option value="ACH">ACH</option><option value="Wire">Wire</option><option value="SEPA">SEPA</option><option value="M-Pesa">M-Pesa</option></select></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div><label className={labelCls}>Batch Name</label><input type="text" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g., September Payroll" className={inputCls} /></div>
              <div className="rounded-xl border border-[#E7E5E4] overflow-hidden">
                <div className="bg-[#F6F5F3] px-4 py-3 border-b border-[#E7E5E4] flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#4C5C88]" /><span className="text-[12px] font-[600] text-[#1C1917]">Import from CSV</span></div>
                  <button onClick={() => {
                    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "wireways-payroll-template.csv";
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  }} className="text-[11px] font-semibold text-[#4C5C88] hover:text-[#3A4A6B] flex items-center gap-1"><Download className="w-3 h-3" /> Download template</button>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-[11px] text-[#A8A29E] leading-relaxed">Upload a CSV with columns: <span className="font-mono font-semibold text-[#1C1917]">name</span>, <span className="font-mono font-semibold text-[#1C1917]">amount</span>, <span className="font-mono font-semibold text-[#1C1917]">currency</span>.</p>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" id="csv-upload" />
                  <label htmlFor="csv-upload" className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#E7E5E4] rounded-xl cursor-pointer hover:border-[#F1622C]/50 hover:bg-[#F1622C]/5 transition-all">
                    <Upload className="w-4 h-4 text-[#A8A29E]" />
                    <span className="text-[13px] font-semibold text-[#57534E]">{csvFileName ? `Loaded: ${csvFileName}` : "Choose CSV file"}</span>
                  </label>
                </div>
              </div>

              {csvPreview && csvPreview.length > 0 && (
                <div className="rounded-xl border border-[#4C5C88]/20 bg-[#4C5C88]/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#4C5C88]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-[600] text-[#1C1917]">Preview & Edit</span>
                      <span className="text-[10px] font-bold text-[#287A55] bg-[#287A55]/10 px-1.5 py-0.5 rounded">{validCount} valid</span>
                      {invalidCount > 0 && <span className="text-[10px] font-bold text-[#C53030] bg-[#C53030]/10 px-1.5 py-0.5 rounded">{invalidCount} errors</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={discardCsvPreview} className="text-[11px] font-semibold text-[#A8A29E] hover:text-[#C53030]">Discard</button>
                      <button onClick={applyCsvPreview} disabled={validCount === 0} className="text-[11px] font-semibold text-[#287A55] hover:text-[#1E5E41] disabled:opacity-40 disabled:cursor-not-allowed">Add {validCount} recipients →</button>
                    </div>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
                    {csvPreview.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2 border-b border-[#4C5C88]/10 last:border-b-0 ${item._valid ? "bg-white" : "bg-[#C53030]/5"}`}>
                        <input type="text" value={item.recipient} onChange={(e) => updateCsvRow(idx, "recipient", e.target.value)} placeholder="Name" className={`flex-1 bg-transparent border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#F1622C] ${!item._valid && !item.recipient ? "border-[#C53030]/40" : ""}`} />
                        <input type="number" value={item.amount} onChange={(e) => updateCsvRow(idx, "amount", e.target.value)} placeholder="0.00" className={`w-20 bg-transparent border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#F1622C] ${!item._valid && !item.amount ? "border-[#C53030]/40" : ""}`} />
                        <select value={item.currency} onChange={(e) => updateCsvRow(idx, "currency", e.target.value)} className="w-20 bg-transparent border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-[12px] outline-none focus:border-[#F1622C]">{SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        {item._valid ? <CheckCircle2 className="w-4 h-4 text-[#287A55] flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-[#C53030] flex-shrink-0" title={item._error} />}
                        <button onClick={() => removeCsvRow(idx)} className="w-6 h-6 rounded flex items-center justify-center text-[#A8A29E] hover:text-[#C53030] flex-shrink-0"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 bg-white border-t border-[#4C5C88]/20 flex items-center justify-between">
                    <span className="text-[11px] text-[#A8A29E]">{csvPreview.length} rows total</span>
                    <span className="text-[12px] font-[700] text-[#1C1917] tabular-nums">Total: {formatCurrency(csvTotal, csvPreview[0]?.currency || "USD")}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls}>Recipients ({batchItems.length})</label>
                  <button onClick={addBatchItem} className="text-[11px] font-semibold text-[#F1622C] flex items-center gap-1"><Plus className="w-3 h-3" /> Add manually</button>
                </div>
                {batchItems.length === 0 ? (
                  <div className="p-6 border border-dashed border-[#E7E5E4] rounded-xl text-center">
                    <Users className="w-6 h-6 text-[#D6D3D1] mx-auto mb-2" />
                    <p className="text-[12px] text-[#A8A29E]">No recipients yet. Import a CSV or add manually.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {batchItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-[#F6F5F3] rounded-xl">
                        <input type="text" value={item.recipient} onChange={(e) => updateBatchItem(idx, "recipient", e.target.value)} placeholder="Name" className="flex-1 bg-white border border-[#E7E5E4] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#F1622C]" />
                        <input type="number" value={item.amount} onChange={(e) => updateBatchItem(idx, "amount", e.target.value)} placeholder="0.00" className="w-24 bg-white border border-[#E7E5E4] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#F1622C]" />
                        <select value={item.currency} onChange={(e) => updateBatchItem(idx, "currency", e.target.value)} className="w-20 bg-white border border-[#E7E5E4] rounded-lg px-2 py-2 text-[13px] outline-none focus:border-[#F1622C]">{SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <button onClick={() => removeBatchItem(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A8A29E] hover:text-[#C53030]"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Frequency</label><select value={batchFrequency} onChange={(e) => setBatchFrequency(e.target.value)} className={inputCls + " bg-white"}>{VALID_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div><label className={labelCls}>Next Run Date</label><input type="date" value={batchNextDate} onChange={(e) => setBatchNextDate(e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Default Rail</label><select value={batchRail} onChange={(e) => setBatchRail(e.target.value)} className={inputCls + " bg-white"}><option value="Auto">Auto</option><option value="ACH">ACH</option><option value="Wire">Wire</option><option value="SEPA">SEPA</option><option value="M-Pesa">M-Pesa</option></select></div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#C53030]/5 border border-[#C53030]/20">
              <AlertTriangle className="w-4 h-4 text-[#C53030] mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[#C53030]">{error}</p>
            </div>
          )}

                  <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3.5 rounded-xl bg-[#F1622C] text-white text-[14px] font-semibold hover:bg-[#D4511E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Create Wire-roll</>}
          </button>
         </div>
      </motion.div>
    </motion.div>
  );
}