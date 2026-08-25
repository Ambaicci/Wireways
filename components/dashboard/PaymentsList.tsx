"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, X, ChevronRight, Repeat, Search } from "lucide-react";
import WicStar from "./WicStar";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

// ── Rail identity colors ────────────────────────────────────
function railColor(rail: string) {
  const r = (rail || "").toLowerCase();
  if (r.includes("mpesa")) return "#287A55";
  if (r.includes("sepa")) return "#7C8DB5";
  if (r.includes("swift")) return "#7C6B51";
  if (r.includes("card")) return "#B98A2E";
  if (r.includes("internal") || r.includes("fx")) return "#F1622C";
  if (r.includes("ach")) return "#7C8DB5";
  return "#B3AC9F";
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatFull = (d: string) =>
  new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-1 rounded-full ${status === "Completed" ? "bg-[#E8F3EC] text-[#287A55]" : "bg-[#F7EBD7] text-[#8A6620]"}`}>
      {status}
    </span>
  );
}

// Rail-tinted icon tile — each transaction's quiet identity
function TxIcon({ tx, size = "md" }: { tx: any; size?: "md" | "lg" }) {
  const c = railColor(tx.rail);
  const dim = size === "lg" ? "w-10 h-10 rounded-[12px]" : "w-8 h-8 rounded-[10px]";
  return (
    <div className={`${dim} flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${c}1A` }}>
      {tx.type === "in"
        ? <ArrowDownLeft className="w-4 h-4" style={{ color: c }} />
        : <ArrowUpRight className="w-4 h-4" style={{ color: c }} />}
    </div>
  );
}

// Quiet 3px spine — the receipt's colored thread
function Spine({ rail }: { rail: string }) {
  return (
    <span
      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
      style={{ backgroundColor: railColor(rail), opacity: 0.45 }}
    />
  );
}

export default function PaymentsList({ transactions }: { transactions: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  const q = query.trim().toLowerCase();
  const filtered = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (!q) return true;
    const dateShort = formatDate(tx.created_at).toLowerCase();
    const dateFull = formatFull(tx.created_at).toLowerCase();
    return (
      tx.name.toLowerCase().includes(q) ||
      tx.rail.toLowerCase().includes(q) ||
      dateShort.includes(q) ||
      dateFull.includes(q)
    );
  });

  const searching = q !== "" || filter !== "all";

  const repeatPrompt = (tx: any) => {
    if (tx.rail === "Internal FX") {
      const m = String(tx.name).match(/Conversion (\w+) → (\w+)/);
      return m ? `Convert ${tx.amount} ${m[1]} to ${m[2]}` : "Convert 100 USD to EUR";
    }
    return tx.type === "in" ? `Request ${tx.amount} from ${tx.name}` : `Send ${tx.amount} to ${tx.name}`;
  };

  return (
    <>
      {/* ═══ Search + direction filter ═══ */}
      <div className="flex flex-col md:flex-row gap-2.5 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipient, rail, or date — try “John” or “Aug 14”…"
            className="w-full bg-[#FFFDF9] border border-[#E8E0D4] rounded-[12px] pl-10 pr-4 py-2.5 text-[13px] text-[#312B1E] placeholder:text-[#B3AC9F] outline-none focus:border-[#F1622C]/50 focus:ring-2 focus:ring-[#F1622C]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-[12px] border border-[#E8E0D4] bg-[#FFFDF9] p-1">
            {(["all", "in", "out"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-[9px] text-[11.5px] font-bold transition-colors ${
                  filter === f ? "bg-[#F1622C] text-white" : "text-[#6E665A] hover:text-[#312B1E]"
                }`}
              >
                {f === "all" ? "All" : f === "in" ? "In" : "Out"}
              </button>
            ))}
          </div>
          {searching && (
            <span className="text-[11px] font-semibold text-[#8D8476] whitespace-nowrap tabular-nums">
              {filtered.length} of {transactions.length}
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] p-10 text-center">
          <div className="text-[14px] font-semibold text-[#312B1E]">No matches</div>
          <p className="text-[12px] text-[#8D8476] mt-1">
            Nothing matches{q ? ` “${query}”` : " this filter"}. Try a name, a rail, or a date like “Aug 14”.
          </p>
          <button
            onClick={() => { setQuery(""); setFilter("all"); }}
            className="mt-3 text-[11px] font-bold text-[#E84D00] hover:text-[#F1622C] transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* ═══ Desktop table — receipt perforations ═══ */}
          <div className="hidden md:block bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] overflow-hidden shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-[#E8E0D4] bg-[#FFFBF6] text-[11px] font-semibold text-[#AAA092] uppercase tracking-wider">
              <div>Recipient / Sender</div>
              <div>Date</div>
              <div>Routing Rail</div>
              <div>Status</div>
              <div className="text-right">Amount</div>
            </div>

            <div className="divide-y divide-dashed divide-[#F1EADF]">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  className="relative grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-[#F7F2EA] cursor-pointer transition-colors group"
                >
                  <Spine rail={tx.rail} />
                  <div className="flex items-center gap-3 min-w-0">
                    <TxIcon tx={tx} />
                    <div className="text-[13.5px] font-semibold text-[#312B1E] truncate group-hover:text-[#C94A1D] transition-colors">{tx.name}</div>
                  </div>

                  <div className="text-[13px] text-[#6E665A]">{formatDate(tx.created_at)}</div>

                  <div className="flex items-center gap-2 text-[13px] text-[#6E665A]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: railColor(tx.rail) }} />
                    {tx.rail}
                  </div>

                  <div><StatusChip status={tx.status} /></div>

                  <div className="flex items-center justify-end gap-2">
                    <div className={`font-mono text-[13.5px] font-semibold tabular-nums ${tx.type === "in" ? "text-[#287A55]" : "text-[#312B1E]"}`}>
                      {tx.type === "in" ? "+" : "-"}{Math.abs(tx.amount).toLocaleString()}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#B3AC9F] group-hover:text-[#312B1E] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ Mobile cards ═══ */}
          <div className="md:hidden space-y-3">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelected(tx)}
                className="relative bg-[#FFFDF9] border border-[#E8E0D4] rounded-[14px] p-4 pl-5 cursor-pointer active:bg-[#F7F2EA] transition-colors"
              >
                <Spine rail={tx.rail} />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <TxIcon tx={tx} />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-[#312B1E] truncate">{tx.name}</div>
                      <div className="flex items-center gap-1.5 text-[11.5px] text-[#8D8476] mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: railColor(tx.rail) }} />
                        {formatDate(tx.created_at)} · {tx.rail}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-mono text-[14px] font-semibold tabular-nums ${tx.type === "in" ? "text-[#287A55]" : "text-[#312B1E]"}`}>
                      {tx.type === "in" ? "+" : "-"}{Math.abs(tx.amount).toLocaleString()}
                    </div>
                    <div className="mt-1"><StatusChip status={tx.status} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ Transaction detail card ═══ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center p-5"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-[480px] bg-[#FFFDF9] rounded-[23px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <TxIcon tx={selected} size="lg" />
                  <div>
                    <div className="text-[15px] font-bold text-[#312B1E]">{selected.name}</div>
                    <div className="mt-1"><StatusChip status={selected.status} /></div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-[30px] h-[30px] rounded-[9px] bg-[#F5EFE6] grid place-items-center text-[#312B1E]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className={`mt-4 text-[32px] font-bold tabular-nums tracking-[-0.04em] ${selected.type === "in" ? "text-[#287A55]" : "text-[#312B1E]"}`}>
                {selected.type === "in" ? "+" : "−"}{Math.abs(selected.amount).toLocaleString()}
              </div>

              <div className="mt-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">Date</span>
                  <span className="text-[12px] font-medium text-[#51483A]">{formatFull(selected.created_at)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">Routing rail</span>
                  <span className="flex items-center gap-2 text-[12px] font-medium text-[#51483A]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: railColor(selected.rail) }} />
                    {selected.rail}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">Direction</span>
                  <span className="text-[12px] font-medium text-[#51483A]">{selected.type === "in" ? "Inflow" : "Outflow"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#AAA092] font-semibold">Reference</span>
                  <span className="text-[12px] font-medium text-[#51483A] font-mono">#{selected.id}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-[#EED7C7] bg-gradient-to-br from-[#FFF7F0] to-[#FFFDF9] px-4 py-3">
                <WicStar className="w-4 h-4 text-[#F1622C]" />
                <span className="text-[12px] text-[#6E665A]">WIC can repeat this in one tap.</span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 rounded-[10px] border border-[#E8E0D4] bg-white py-2.5 text-[12px] font-bold text-[#312B1E] hover:border-[#D7CABB] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { prefillDock(repeatPrompt(selected)); setSelected(null); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[10px] bg-[#F1622C] py-2.5 text-[12px] font-bold text-white hover:bg-[#E0531C] transition-colors"
                >
                  <Repeat className="w-3.5 h-3.5" /> Repeat with WIC
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}