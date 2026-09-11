"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Building2, X, Building, Zap, Plus, Flame, Target, Gauge, Coins, Trash2 } from "lucide-react";
import WicStar from "./WicStar";

const ACCENT = "#C94A1D";
const ACCENT_SOFT = "rgba(201,74,29,0.12)";

function prefillDock(text: string) {
  window.dispatchEvent(new CustomEvent("prefill-ai-dock", { detail: text }));
}

const typeIcon = (type: string, cls = "w-5 h-5") => {
  if (type === "Card") return <CreditCard className={cls} style={{ color: ACCENT }} />;
  if (type === "Mobile") return <Smartphone className={cls} style={{ color: ACCENT }} />;
  return <Building2 className={cls} style={{ color: ACCENT }} />;
};

function ruleChips(m: any) {
  const chips: { icon: any; label: string }[] = [];
  if (m.single_use) chips.push({ icon: Flame, label: "Burner · one use" });
  if (m.purpose) chips.push({ icon: Target, label: `For: ${m.purpose}` });
  if (m.monthly_limit) chips.push({ icon: Gauge, label: `${m.monthly_limit.toLocaleString()}/mo cap` });
  if (m.currency) chips.push({ icon: Coins, label: `${m.currency}-matched` });
  return chips;
}

interface DoorPrefill { single_use?: boolean; purpose?: string; monthly_limit?: string; currency?: string; }

const GUIDE: { icon: any; title: string; desc: string; cta: string; prefill: DoorPrefill }[] = [
  { icon: Flame, title: "Burner door", desc: "Opens exactly once, then vanishes. For a one-off vendor you don't fully trust — if they're hacked, they can't come back.", cta: "Make a burner", prefill: { single_use: true } },
  { icon: Target, title: "Purpose door", desc: "Only opens for one thing — “this door pays only the designer.” Anywhere else, it refuses.", cta: "Make a purpose door", prefill: { purpose: "" } },
  { icon: Gauge, title: "Allowance door", desc: "A monthly cap — “$500/month, no more.” Perfect for staff, subscriptions, or a budget you won't exceed.", cta: "Set an allowance", prefill: { monthly_limit: "500" } },
  { icon: Coins, title: "Currency-matched door", desc: "Draws from the EUR room when you spend in Europe — so you never pay the hidden currency-change fee.", cta: "Match a currency", prefill: { currency: "EUR" } },
];

export default function CardsList({ methods, strategy, suggestion }: { methods: any[]; strategy: any[]; suggestion: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<any | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [prefill, setPrefill] = useState<DoorPrefill>({});

  const openAdd = (p: DoorPrefill = {}) => { setPrefill(p); setIsAddOpen(true); };

  return (
    <>
      {/* ═══ How doors work — guiding cards ═══ */}
      <div className="rounded-[20px] border border-[#E8E0D4] bg-[#FFFDF9] p-6">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ backgroundColor: ACCENT_SOFT }}>
            <span style={{ color: ACCENT }}>
  <WicStar className="w-4 h-4" />
</span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#312B1E] tracking-[-0.02em]">How doors work</h2>
            <p className="text-[11px] text-[#8D8476]">Your wallets are rooms. A door is a way in or out — and every door can carry rules.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {GUIDE.map((g) => (
            <div key={g.title} className="flex flex-col rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_SOFT }}>
                  <g.icon className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#312B1E]">{g.title}</div>
                  <p className="text-[12px] text-[#8D8476] mt-0.5 leading-relaxed">{g.desc}</p>
                </div>
              </div>
              <button onClick={() => openAdd(g.prefill)} className="mt-3 self-start text-[11px] font-bold hover:underline transition-colors" style={{ color: ACCENT }}>
                {g.cta} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2">
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-[10px] text-[12.5px] font-bold hover:brightness-110 transition-all shadow-[0_6px_16px_rgba(201,74,29,0.25)]"
          style={{ background: ACCENT }}
        >
          <Plus className="w-4 h-4" /> Add door
        </button>
        <button
          onClick={() => prefillDock("Create a single-use virtual card for a one-off vendor payment")}
          className="flex items-center gap-2 border border-[#E8E0D4] bg-[#FFFDF9] px-4 py-2.5 rounded-[10px] text-[12.5px] font-bold text-[#6E665A] hover:border-[#D7CABB] transition-colors"
        >
          <WicStar className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Ask WIC
        </button>
      </div>

      {/* WIC suggests a purpose door */}
      {suggestion && (
        <div className="flex items-start justify-between gap-4 rounded-[14px] border border-[#EED7C7] bg-gradient-to-br from-[#FFF7F0] to-[#FFFDF9] p-4">
          <div className="flex items-start gap-2.5">
            <WicStar className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="text-[12.5px] text-[#6E665A] leading-relaxed">
              You usually pay <span className="font-bold text-[#312B1E]">{suggestion}</span> each month. Want a{" "}
              <span className="font-bold text-[#312B1E]">purpose door</span> that only pays {suggestion}?
            </p>
          </div>
          <button onClick={() => openAdd({ purpose: suggestion })} className="shrink-0 text-[11px] font-bold text-white px-3 py-2 rounded-[9px] hover:brightness-110 transition-all" style={{ background: ACCENT }}>
            Create it
          </button>
        </div>
      )}

      {/* Funding strategy board */}
      <div className="rounded-[20px] border p-6" style={{ borderColor: `${ACCENT}33`, backgroundColor: ACCENT_SOFT }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ backgroundColor: `${ACCENT}22` }}>
            <WicStar className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#312B1E] tracking-[-0.02em]">Funding strategy</h2>
            <p className="text-[10px] text-[#8D8476] font-bold uppercase tracking-[0.1em]">The right door for what's due</p>
          </div>
        </div>

        {strategy.length === 0 ? (
          <p className="text-[12.5px] text-[#6E665A]">Nothing due soon — WIC will surface the cheapest path as obligations approach.</p>
        ) : (
          <div className="space-y-2.5">
            {strategy.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-4 rounded-[12px] border border-[#E8E0D4] bg-[#FFFDF9] p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Building className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#312B1E] truncate">{s.name} · {s.amount.toLocaleString()} {s.currency}</div>
                    <div className="text-[11.5px] text-[#8D8476] mt-0.5">due in {s.days}d</div>
                  </div>
                </div>
                <div className={`text-right flex-shrink-0 max-w-[55%] text-[11.5px] font-semibold leading-snug ${s.tone === "good" ? "text-[#287A55]" : "text-[#6E5B3E]"}`}>{s.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doors */}
      {methods.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-[14px] flex items-center justify-center mb-4" style={{ backgroundColor: ACCENT_SOFT }}>
            <CreditCard className="w-6 h-6" style={{ color: ACCENT }} />
          </div>
          <h2 className="text-[17px] font-bold text-[#312B1E]">No doors yet</h2>
          <p className="text-[13px] text-[#8D8476] mt-1.5 max-w-[360px] mx-auto">Add a card, bank account, or mobile wallet — then give it rules so WIC routes money safely.</p>
        </div>
      ) : (
        <div className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[16px] divide-y divide-dashed divide-[#F1EADF] overflow-hidden shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
          {methods.map((m) => {
            const chips = ruleChips(m);
            return (
              <div key={m.id} onClick={() => setSelected(m)} className="flex items-center gap-4 p-5 hover:bg-[#F7F2EA] cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ACCENT_SOFT }}>
                  {typeIcon(m.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-[#312B1E] truncate group-hover:text-[#C94A1D] transition-colors">{m.name}</h3>
                  <p className="text-[12px] text-[#8D8476] mt-0.5 font-mono truncate">{m.details}</p>
                  {chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {chips.map((c, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5EFE6] text-[#6E5B3E]">
                          <c.icon className="w-3 h-3" /> {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add-door modal */}
      <AnimatePresence>
        {isAddOpen && <AddDoorModal onClose={() => setIsAddOpen(false)} prefill={prefill} />}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center p-5"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-[460px] bg-[#FFFDF9] rounded-[23px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] grid place-items-center" style={{ backgroundColor: ACCENT_SOFT }}>
                    {typeIcon(selected.type, "w-4 h-4")}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[#312B1E]">{selected.name}</div>
                    <div className="text-[11px] text-[#8D8476] font-mono mt-0.5">{selected.details}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-[30px] h-[30px] rounded-[9px] bg-[#F5EFE6] grid place-items-center text-[#312B1E]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF]">
                <div className="flex justify-between px-4 py-2.5 text-[12px]"><span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Burner</span><span className="font-semibold text-[#51483A]">{selected.single_use ? "Yes — one use" : "No"}</span></div>
                <div className="flex justify-between px-4 py-2.5 text-[12px]"><span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Purpose</span><span className="font-semibold text-[#51483A]">{selected.purpose || "Any"}</span></div>
                <div className="flex justify-between px-4 py-2.5 text-[12px]"><span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Monthly cap</span><span className="font-semibold text-[#51483A]">{selected.monthly_limit ? selected.monthly_limit.toLocaleString() : "None"}</span></div>
                <div className="flex justify-between px-4 py-2.5 text-[12px]"><span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Currency</span><span className="font-semibold text-[#51483A]">{selected.currency || "Any"}</span></div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={async () => { await fetch(`/api/wic/methods?id=${selected.id}`, { method: "DELETE" }); setSelected(null); router.refresh(); }}
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-[#E7C9BF] bg-[#F9ECE9] px-4 py-2.5 text-[12px] font-bold text-[#A84B3D] hover:bg-[#F5E5E0] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
                <button
                  onClick={() => { prefillDock(`Send 100 using ${selected.name}`); setSelected(null); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[10px] text-white py-2.5 text-[12px] font-bold hover:brightness-110 transition-colors"
                  style={{ background: ACCENT }}
                >
                  <Zap className="w-3.5 h-3.5" /> Use for next payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AddDoorModal({ onClose, prefill }: { onClose: () => void; prefill: DoorPrefill }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", type: "Card", details: "",
    currency: prefill.currency || "", single_use: !!prefill.single_use,
    purpose: prefill.purpose || "", monthly_limit: prefill.monthly_limit || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/wic/methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, type: form.type, details: form.details,
        currency: form.currency || null, single_use: form.single_use,
        purpose: form.purpose || null, monthly_limit: form.monthly_limit ? Number(form.monthly_limit) : null,
      }),
    });
    setSaving(false);
    router.refresh();
    onClose();
  };

  const inputCls = "mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-3.5 py-2.5 text-[13px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]";
  const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#FFFDF9] rounded-t-[23px] md:rounded-[23px] w-full md:max-w-md shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-[#E8E0D4] overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-[#F1EADF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <WicStar className="w-4 h-4" style={{ color: ACCENT }} />
            <h3 className="text-[17px] font-bold text-[#312B1E]">Add a door</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D8476] hover:bg-[#F5EFE6] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Personal Visa" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                <option>Card</option><option>Mobile</option><option>Bank</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Details</label>
              <input required value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="•••• 4242" className={inputCls} />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4 space-y-3">
            <div className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Door rules</div>

            <button
              type="button"
              onClick={() => setForm({ ...form, single_use: !form.single_use })}
              className={`w-full flex items-center justify-between rounded-[10px] border px-3.5 py-2.5 transition-all ${form.single_use ? "border-[#C94A1D] bg-[#FDEBE0]" : "border-[#E8E0D4]"}`}
            >
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#312B1E]"><Flame className="w-4 h-4" style={{ color: ACCENT }} /> Burner — one use, then gone</span>
              <span className={`rounded-full relative transition-colors ${form.single_use ? "bg-[#C94A1D]" : "bg-[#E8E0D4]"}`} style={{ width: 32, height: 18 }}>
                <span className={`absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white transition-all ${form.single_use ? "left-[16px]" : "left-[2px]"}`} />
              </span>
            </button>

            <div>
              <label className={labelCls}>Purpose (optional)</label>
              <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Only pays the designer" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Monthly cap</label>
                <input type="number" min="0" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })} placeholder="500" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Currency-match</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                  <option value="">Any</option><option>USD</option><option>EUR</option><option>GBP</option><option>KES</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-[12px] text-[13.5px] font-bold hover:brightness-110 transition-all disabled:opacity-50"
            style={{ background: ACCENT }}>
            <Plus className="w-4 h-4" /> Create door
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}