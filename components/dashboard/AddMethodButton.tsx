"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Plus, Loader2, CreditCard, Building2, Smartphone } from "lucide-react";
import { addPaymentMethod } from "@/lib/actions";
import { toast } from "@/components/ui/Toaster";

export default function AddMethodButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "Card", name: "", details: "" });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await addPaymentMethod({
      type: form.type,
      name: form.name.trim(),
      details: form.details.trim(),
    });
    setSaving(false);
    if (res.success) {
      toast("Payment method added.", "success");
      router.refresh();
      setIsOpen(false);
      setForm({ type: "Card", name: "", details: "" });
    } else {
      toast(res.message || "Could not add method.", "error");
    }
  };

  const typeIcon =
    form.type === "Card" ? <CreditCard className="w-4 h-4 text-[#F1622C]" /> :
    form.type === "Mobile" ? <Smartphone className="w-4 h-4 text-[#F1622C]" /> :
    <Building2 className="w-4 h-4 text-[#F1622C]" />;

  const inputCls = "mt-1.5 w-full border border-[#EAE6DF] rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white";
  const labelCls = "text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#F1622C] text-white px-4 py-2.5 rounded-xl text-[13.5px] font-medium hover:bg-[#C94A1D] transition-all"
      >
        <Plus className="w-4 h-4" /> Add Method
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-[#18140F]/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-2xl border border-[#EAE6DF] overflow-hidden"
              initial={{ y: 40, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 border-b border-[#F1EEE8] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[11px] bg-[#FDEBE0] flex items-center justify-center">
                    {typeIcon}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#18140F] tracking-tight">Add Payment Method</h3>
                    <p className="text-[11.5px] text-[#8C8579] mt-0.5">So the AI can route payments to the right place.</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8579] hover:bg-[#FAFAF9] hover:text-[#18140F] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    <option value="Card">Card</option>
                    <option value="Bank">Bank Account</option>
                    <option value="Mobile">Mobile Wallet</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Personal Visa" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Details</label>
                  <input required value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="•••• 4242 or +254 7•• ••• •••" className={inputCls} />
                </div>

                <button
                  type="submit"
                  disabled={saving || !form.name.trim() || !form.details.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#F97C4B] to-[#EE5A1F] text-white py-3 rounded-xl text-[14px] font-semibold hover:brightness-105 transition-all disabled:opacity-50 shadow-lg shadow-[#F1622C]/25"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Method
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}