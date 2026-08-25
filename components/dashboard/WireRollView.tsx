"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock, Play, Pause, Trash2, Plus, AlertTriangle, X, Loader2,
  Repeat, CheckCircle2, Zap, Upload, ChevronRight,
} from "lucide-react";
import {
  executeWireRollRun, toggleWireRoll, deleteWireRoll, createWireRoll,
  autoFundWireRoll, setWireRollAutoRun,
} from "@/lib/actions";
import WireRollActions from "./WireRollActions";
import WicStar from "./WicStar";

interface Roll { id: number; name: string; recipient: string; currency: string; amount: number; frequency: string; next_run_date: string; rail: string; status: string; auto_run: number; }
interface Run { id: number; roll_id: number; amount: number; status: string; executed_at: string; }
interface Wallet { currency: string; balance: number; }
interface Item { id: number; roll_id: number; recipient: string; currency: string; amount: number; rail: string; }

const ACCENT = "#7C8DB5";
const ACCENT_SOFT = "rgba(124,141,181,0.14)";

const railByCurrency: Record<string, string> = {
  KES: "MPesa B2C", EUR: "SEPA Instant", USD: "SWIFT gpi", GBP: "SWIFT gpi", USDC: "USDC Polygon",
};

const freqLabel: Record<string, string> = {
  weekly: "Every week", biweekly: "Every 2 weeks", monthly: "Monthly",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

export default function WireRollView({ rolls, runs, wallets, items }: { rolls: Roll[]; runs: Run[]; wallets: Wallet[]; items: Item[] }) {
  const router = useRouter();
  const [createMode, setCreateMode] = useState<"single" | "batch" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Roll | null>(null);

  const active = rolls.filter((r) => r.status === "active");
  const in7 = new Date(Date.now() + 7 * 86400000);
  const upcoming = active.filter((r) => new Date(r.next_run_date) <= in7);
  const completed = runs.filter((r) => r.status === "completed").length;
  const successRate = runs.length ? Math.round((completed / runs.length) * 100) : null;

  const gapsByRoll = active
    .map((r) => {
      const its = items.filter((i) => i.roll_id === r.id);
      const need: Record<string, number> = {};
      if (its.length > 0) its.forEach((i) => { need[i.currency] = (need[i.currency] || 0) + i.amount; });
      else need[r.currency] = (need[r.currency] || 0) + r.amount;
      const gaps = Object.entries(need)
        .map(([cur, amt]) => ({ cur, gap: amt - (wallets.find((w) => w.currency === cur)?.balance || 0) }))
        .filter((g) => g.gap > 0);
      return { roll: r, gaps };
    })
    .filter((x) => x.gaps.length > 0);

  const handleRun = async (id: number) => {
    setBusyId(id);
    await executeWireRollRun(id);
    setBusyId(null);
    router.refresh();
  };

  const handleAutoFund = async (id: number) => {
    setBusyId(id);
    await autoFundWireRoll(id);
    setBusyId(null);
    router.refresh();
  };

  const handleAutoRun = async (r: Roll) => {
    await setWireRollAutoRun({ id: r.id, autoRun: r.auto_run === 0 });
    router.refresh();
  };

  const handleToggle = async (r: Roll) => {
    await toggleWireRoll({ id: r.id, status: r.status === "active" ? "paused" : "active" });
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteWireRoll(id);
    router.refresh();
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Wire-roll</h1>
          <p className="text-[13px] text-[#8D8476] mt-1">Payroll, vendor batches and remittations — on rails WIC chooses.</p>
        </div>
        <WireRollActions onNewRoll={() => setCreateMode("single")} />
      </div>

      {/* Quiet WIC line */}
      <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E8E0D4] rounded-[12px] px-4 py-3">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C8DB5] opacity-40" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-[#7C8DB5]" />
        </span>
        <span className="text-[12.5px] text-[#6E665A]">
          <span className="font-bold text-[#312B1E]">WIC</span> · {active.length} active commitment{active.length === 1 ? "" : "s"} —{" "}
          {gapsByRoll.length === 0
            ? "all fully funded ahead of their run dates."
            : `${gapsByRoll.length} need${gapsByRoll.length === 1 ? "s" : ""} funding before the next run.`}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4">
          <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Active rolls</div>
          <div className="text-[22px] font-bold text-[#312B1E] mt-1 tabular-nums">{active.length}</div>
        </div>
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4">
          <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Due in 7 days</div>
          <div className="text-[22px] font-bold mt-1 tabular-nums" style={{ color: "#B98A2E" }}>{upcoming.length}</div>
        </div>
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4">
          <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">First-try success</div>
          <div className="text-[22px] font-bold text-[#287A55] mt-1 tabular-nums">{successRate !== null ? `${successRate}%` : "—"}</div>
        </div>
      </div>

      {/* How it works — guiding cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_SOFT }}>
              <Repeat className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#312B1E]">Standing order</div>
              <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">One recipient, fixed amount — rent, subscriptions, regular transfers.</p>
            </div>
          </div>
          <button onClick={() => setCreateMode("single")} className="mt-3 self-start text-[11px] font-bold hover:underline transition-colors" style={{ color: ACCENT }}>
            Start one →
          </button>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_SOFT }}>
              <Upload className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#312B1E]">Payroll batch</div>
              <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">Many payees at once — paste a CSV (name, currency, amount) and WIC assigns the rails.</p>
            </div>
          </div>
          <button onClick={() => setCreateMode("batch")} className="mt-3 self-start text-[11px] font-bold hover:underline transition-colors" style={{ color: ACCENT }}>
            Load a batch →
          </button>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_SOFT }}>
              <CalendarClock className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#312B1E]">Vendor retainer</div>
              <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">Recurring service payments — designers, consultants, agencies on schedule.</p>
            </div>
          </div>
          <button onClick={() => setCreateMode("single")} className="mt-3 self-start text-[11px] font-bold hover:underline transition-colors" style={{ color: ACCENT }}>
            Start one →
          </button>
        </div>
      </div>

      {/* WIC Intelligence — funding gaps */}
      <div className="relative rounded-[20px] border p-6 overflow-hidden" style={{ borderColor: `${ACCENT}33`, backgroundColor: ACCENT_SOFT }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ backgroundColor: `${ACCENT}22` }}>
            <WicStar className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#312B1E] tracking-[-0.02em]">Wire-roll Intelligence</h2>
            <p className="text-[10px] text-[#8D8476] font-bold uppercase tracking-[0.1em]">Recurring payment engine</p>
          </div>
        </div>

        <div className="space-y-3">
          {gapsByRoll.length === 0 && (
            <div className="flex items-start gap-3 p-4 rounded-[12px] border border-[#E8E0D4] bg-[#FFFDF9]">
              <CheckCircle2 className="w-4 h-4 text-[#287A55] mt-0.5" />
              <p className="text-[12.5px] text-[#6E665A] leading-relaxed">All active rolls are fully funded ahead of their run dates. No action required.</p>
            </div>
          )}
          {gapsByRoll.map(({ roll, gaps }) => (
            <div key={roll.id} className="p-4 rounded-[12px] border border-[#E7C9BF] bg-[#F9ECE9]">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#A84B3D] mt-0.5" />
                  <p className="text-[12.5px] text-[#A84B3D] leading-relaxed">
                    <span className="font-bold">Funding gap — {roll.name}:</span>{" "}
                    {gaps.map((g) => `${g.cur} short ${g.gap.toLocaleString()}`).join(" · ")} before {formatDate(roll.next_run_date)}.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAutoFund(roll.id)}
                    disabled={busyId === roll.id}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-2 rounded-[9px] transition-all disabled:opacity-50"
                    style={{ backgroundColor: "#A84B3D" }}
                  >
                    {busyId === roll.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Auto-Fund
                  </button>
                  <button
                    onClick={() => prefillDock(`Top up my ${gaps[0].cur} wallet with ${Math.ceil(gaps[0].gap)} ${gaps[0].cur}`)}
                    className="text-[11px] font-bold text-[#6E665A] border border-[#E8E0D4] bg-[#FFFDF9] hover:border-[#D7CABB] px-3 py-2 rounded-[9px] transition-all"
                  >
                    Ask WIC
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rolls list — Collect-style clickable rows */}
      {rolls.length === 0 ? (
        <div className="relative bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] py-16 text-center overflow-hidden shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${ACCENT}15` }} />
          <div className="relative w-14 h-14 mx-auto rounded-[14px] flex items-center justify-center mb-4" style={{ backgroundColor: ACCENT_SOFT }}>
            <Repeat className="w-6 h-6" style={{ color: ACCENT }} />
          </div>
          <h2 className="text-[17px] font-bold text-[#312B1E] tracking-[-0.02em]">No wire-rolls yet</h2>
          <p className="text-[13px] text-[#8D8476] mt-1.5 max-w-[380px] mx-auto">Set up payroll, rent, retainers — anything recurring — and let WIC keep it funded and on time.</p>
        </div>
      ) : (
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] divide-y divide-dashed divide-[#F1EADF] overflow-hidden shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
          {rolls.map((r) => {
            const rollItems = items.filter((i) => i.roll_id === r.id);
            const isBatch = rollItems.length > 0;
            const hasGap = gapsByRoll.some((x) => x.roll.id === r.id);
            return (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-[#F7F2EA] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_SOFT }}>
                    <Repeat className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[14px] font-bold text-[#312B1E] truncate group-hover:text-[#C94A1D] transition-colors">{r.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-[#E8F3EC] text-[#287A55]" : "bg-[#F5EFE6] text-[#8D8476]"}`}>{r.status}</span>
                      {isBatch && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1EADF] text-[#6E5B3E]">{rollItems.length} recipients · batch</span>
                      )}
                      {hasGap && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F9ECE9] text-[#A84B3D]">needs funding</span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#8D8476] mt-0.5 truncate">
                      {r.recipient} · {r.rail} · {freqLabel[r.frequency] || r.frequency} · next {formatDate(r.next_run_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-[14px] font-bold text-[#312B1E] tabular-nums">{isBatch ? "~" : ""}{r.amount.toLocaleString()} {r.currency}</div>
                    <div className="text-[10px] text-[#8D8476]">per cycle</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#B3AC9F] group-hover:text-[#312B1E] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent runs */}
      {runs.length > 0 && (
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] p-5">
          <h3 className="text-[13px] font-bold text-[#312B1E] mb-4">Recent runs</h3>
          <div className="space-y-3">
            {runs.map((run) => {
              const roll = rolls.find((r) => r.id === run.roll_id);
              return (
                <div key={run.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: run.status === "completed" ? "#287A55" : "#A84B3D" }} />
                    <span className="text-[13px] text-[#6E665A] truncate">{roll?.name || "Deleted roll"}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-mono text-[12.5px] text-[#312B1E] tabular-nums">{run.amount.toLocaleString()}</span>
                    <span className="text-[11px] text-[#8D8476]">{formatDate(run.executed_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Roll detail modal ═══ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center p-5"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-[520px] bg-[#FFFDF9] rounded-[23px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] grid place-items-center" style={{ backgroundColor: ACCENT_SOFT }}>
                    <Repeat className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[#312B1E]">{selected.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selected.status === "active" ? "bg-[#E8F3EC] text-[#287A55]" : "bg-[#F5EFE6] text-[#8D8476]"}`}>{selected.status}</span>
                      {selected.auto_run === 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F3EC] text-[#287A55]">Auto-run</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-[30px] h-[30px] rounded-[9px] bg-[#F5EFE6] grid place-items-center text-[#312B1E]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 text-[32px] font-bold tabular-nums tracking-[-0.04em] text-[#312B1E]">
                {selected.amount.toLocaleString()} {selected.currency}
              </div>
              <p className="text-[12px] text-[#8D8476] mt-1">per cycle · {freqLabel[selected.frequency] || selected.frequency}</p>

              <div className="mt-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-bold">Recipient</span>
                  <span className="text-[12px] font-medium text-[#51483A]">{selected.recipient}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-bold">Rail</span>
                  <span className="text-[12px] font-medium text-[#51483A]">{selected.rail}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-bold">Next run</span>
                  <span className="text-[12px] font-medium text-[#51483A]">{formatDate(selected.next_run_date)}</span>
                </div>
              </div>

              {items.filter((i) => i.roll_id === selected.id).length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em] mb-2">Batch recipients</div>
                  <div className="rounded-[12px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF] max-h-[160px] overflow-y-auto">
                    {items.filter((i) => i.roll_id === selected.id).map((i) => (
                      <div key={i.id} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[12px] font-medium text-[#51483A] truncate">{i.recipient}</span>
                        <span className="text-[11px] font-mono text-[#8D8476]">{i.amount.toLocaleString()} {i.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { handleRun(selected.id); setSelected(null); }}
                  disabled={busyId === selected.id}
                  className="flex items-center justify-center gap-2 rounded-[10px] bg-[#312B1E] text-white py-2.5 text-[12px] font-bold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {busyId === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Run now
                </button>
                <button
                  onClick={() => { handleAutoRun(selected); setSelected(null); }}
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[12px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                >
                  {selected.auto_run === 1 ? "Disable auto" : "Enable auto"}
                </button>
                <button
                  onClick={() => { handleToggle(selected); setSelected(null); }}
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[12px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                >
                  {selected.status === "active" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
                </button>
                <button
                  onClick={() => { handleDelete(selected.id); setSelected(null); }}
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-[#E7C9BF] bg-[#F9ECE9] py-2.5 text-[12px] font-bold text-[#A84B3D] hover:bg-[#F5E5E0] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {createMode && <CreateRollModal initialMode={createMode} onClose={() => setCreateMode(null)} />}
      </AnimatePresence>
    </div>
  );
}

function CreateRollModal({ onClose, initialMode }: { onClose: () => void; initialMode: "single" | "batch" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "batch">(initialMode);
  const [form, setForm] = useState({ name: "", recipient: "", currency: "USD", amount: "", frequency: "monthly", nextRunDate: "", rail: "SWIFT gpi" });
  const [csv, setCsv] = useState("");
  const [items, setItems] = useState<{ recipient: string; currency: string; amount: number; rail: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const aiSuggest = () => {
    const rail = railByCurrency[form.currency] || "SWIFT gpi";
    const d = new Date();
    d.setDate(d.getDate() + (form.frequency === "weekly" ? 7 : form.frequency === "biweekly" ? 14 : 17));
    setForm({ ...form, rail, nextRunDate: d.toISOString().slice(0, 10) });
  };

  const parseCsv = () => {
    const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: { recipient: string; currency: string; amount: number; rail: string }[] = [];
    for (const line of lines) {
      const [recipient, currency, amount, rail] = line.split(",").map((s) => s?.trim());
      if (!recipient || !currency || !amount) continue;
      const cur = currency.toUpperCase();
      parsed.push({ recipient, currency: cur, amount: parseFloat(amount) || 0, rail: rail || railByCurrency[cur] || "SWIFT gpi" });
    }
    setItems(parsed);
    if (parsed.length === 0) setError("Couldn't parse. Format: name, currency, amount, rail?");
    else setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createWireRoll({
      ...form,
      amount: parseFloat(form.amount) || 0,
      items: mode === "batch" ? items : undefined,
    });
    setSaving(false);
    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setError(res.message || "Could not create roll.");
    }
  };

  const inputCls = "mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-3.5 py-2.5 text-[13px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]";
  const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

  return (
    <motion.div
      className="fixed inset-0 bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#FFFDF9] rounded-t-[23px] md:rounded-[23px] w-full md:max-w-lg shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-[#E8E0D4] overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-7 pb-5 border-b border-[#F1EADF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <WicStar className="w-4 h-4" style={{ color: ACCENT }} />
            <div>
              <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[#312B1E]">New wire-roll</h3>
              <p className="text-[11px] text-[#8D8476] mt-0.5">Single recipient or a full payroll batch.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D8476] hover:bg-[#F5EFE6] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E7C9BF] bg-[#F9ECE9] px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-[#A84B3D] flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-[12px] leading-[1.5] text-[#A84B3D] font-bold">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-[#A84B3D] hover:text-[#7C3328]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {(["single", "batch"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[12px] font-bold border transition-all ${
                  mode === m ? "border-[#312B1E] bg-[#312B1E] text-white" : "border-[#E8E0D4] text-[#6E665A] hover:border-[#D7CABB]"
                }`}
              >
                {m === "single" ? <Repeat className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                {m === "single" ? "Single recipient" : "Batch (CSV)"}
              </button>
            ))}
          </div>

          <div>
            <label className={labelCls}>Roll name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly Payroll — Riverside" className={inputCls} />
          </div>

          {mode === "single" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Recipient</label>
                  <input required value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Acme Team" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Amount</label>
                  <input required type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                    {["USD", "EUR", "GBP", "USDC", "KES"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Rail</label>
                  <select value={form.rail} onChange={(e) => setForm({ ...form, rail: e.target.value })} className={inputCls}>
                    {["SWIFT gpi", "SEPA Instant", "MPesa B2C", "USDC Polygon"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelCls}>Paste CSV — name, currency, amount, rail (optional)</label>
                <textarea
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  rows={5}
                  placeholder={"Head Chef — A. Kim, USD, 3200, SWIFT gpi\nWaitstaff Pool, KES, 1250000\nSous Team, EUR, 9800"}
                  className={`${inputCls} font-mono text-[12px] resize-none`}
                />
              </div>
              <button type="button" onClick={parseCsv} className="w-full flex items-center justify-center gap-2 bg-[#312B1E] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all">
                <WicStar className="w-4 h-4" style={{ color: "#F1622C" }} /> Parse & let WIC assign rails
              </button>
              {items.length > 0 && (
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-[#FFFBF6] rounded-[10px] px-3.5 py-2 border border-[#E8E0D4]">
                      <span className="text-[12px] font-medium text-[#312B1E] truncate">{i.recipient}</span>
                      <span className="font-mono text-[11px] text-[#8D8476] flex-shrink-0">{i.amount.toLocaleString()} {i.currency} · {i.rail}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={inputCls}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Next run date</label>
              <input required type="date" value={form.nextRunDate} onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })} className={inputCls} />
            </div>
          </div>

          {mode === "single" && (
            <button type="button" onClick={aiSuggest} className="w-full flex items-center justify-center gap-2 bg-[#312B1E] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all">
              <WicStar className="w-4 h-4" style={{ color: "#F1622C" }} /> Let WIC pick rail & date
            </button>
          )}

          <button
            type="submit"
            disabled={saving || (mode === "batch" && items.length === 0)}
            className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-[12px] text-[14px] font-bold hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_6px_16px_rgba(124,141,181,0.25)]"
            style={{ background: ACCENT }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create wire-roll
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}