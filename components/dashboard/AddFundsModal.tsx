"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Plus, CreditCard, Loader2, Check, AlertTriangle } from "lucide-react";
import { addFunds } from "@/lib/actions";
import WicStar from "./WicStar";

interface Props {
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT = "#287A55";
const ACCENT_SOFT = "rgba(40,122,85,0.12)";

export default function AddFundsModal({ currency, isOpen, onClose }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSymbol = () => {
    if (currency === "KES") return "KSh ";
    if (currency === "USDC") return "";
    if (currency === "EUR") return "€";
    if (currency === "GBP") return "£";
    return "$";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amount || amt <= 0) return;

    setIsLoading(true);
    setError(null);
    const result = await addFunds({ currency, amount: amt });
    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      router.refresh();
    } else {
      setError(result.message || "Could not add funds.");
    }
  };

  const handleDone = () => {
    setSuccess(false);
    setAmount("");
    setError(null);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#312B1E]/40 backdrop-blur-[7px] p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={handleDone}
    >
      <motion.div
        className="bg-[#FFFDF9] rounded-t-[23px] md:rounded-[23px] w-full md:max-w-[440px] shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-[#E8E0D4] overflow-hidden"
        initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1EADF]">
          <div className="flex items-center gap-2.5">
            <WicStar className="w-4 h-4" style={{ color: ACCENT } as any} />
            <div>
              <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#312B1E]">Add funds</h2>
              <p className="text-[12px] text-[#8D8476] mt-0.5">Top up your {currency} wallet</p>
            </div>
          </div>
          <button onClick={handleDone} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D8476] hover:bg-[#F5EFE6] hover:text-[#312B1E] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          /* ═══ SUCCESS — green seal inside ═══ */
          <div className="p-7 text-center">
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="inline-flex w-16 h-16 items-center justify-center rounded-full border shadow-[0_0_0_6px_rgba(40,122,85,0.10)]"
              style={{ backgroundColor: ACCENT_SOFT, borderColor: `${ACCENT}99` }}
            >
              <Check className="w-7 h-7" style={{ color: ACCENT } as any} strokeWidth={3} />
            </motion.span>
            <h4 className="text-[17px] font-bold text-[#312B1E] mt-4">Funds added</h4>
            <p className="text-[13px] text-[#8D8476] mt-1.5">
              {getSymbol()}{parseFloat(amount).toLocaleString()} added to your {currency} wallet.
            </p>
            <div className="mt-4 mx-auto max-w-[280px] rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF] text-left">
              <div className="flex justify-between px-4 py-2.5 text-[12px]">
                <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Wallet</span>
                <span className="font-semibold text-[#51483A]">{currency}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-[12px]">
                <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Source</span>
                <span className="flex items-center gap-1.5 font-semibold text-[#51483A]">
                  <CreditCard className="w-3 h-3" /> Card •••• 4242
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-[12px]">
                <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">ETA</span>
                <span className="font-semibold" style={{ color: ACCENT }}>Instant</span>
              </div>
            </div>
            <button onClick={handleDone}
              className="mt-6 w-full bg-[#312B1E] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

            {/* Amount */}
            <div className="relative rounded-[16px] border border-[#E8E0D4] bg-[#FFFBF6] p-4 focus-within:border-[#F1622C]/60 focus-within:ring-4 focus-within:ring-[#F1622C]/10 transition-all">
              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ backgroundColor: ACCENT, opacity: 0.5 }} />
              <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em] block mb-2 pl-3">Amount to add</label>
              <div className="flex items-center gap-3 pl-3">
                <span className="text-[28px] font-mono font-bold text-[#312B1E]">{getSymbol()}</span>
                <input
                  type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent border-none outline-none text-[28px] font-mono font-bold text-[#312B1E] placeholder:text-[#B3AC9F] tabular-nums"
                  autoFocus
                />
                <span className="text-[14px] font-bold text-[#312B1E] bg-white border border-[#E8E0D4] rounded-[10px] px-3 py-2">
                  {currency}
                </span>
              </div>
            </div>

            {/* Method */}
            <div className="flex items-center gap-3 rounded-[12px] border border-[#E8E0D4] bg-[#FFFBF6] p-4">
              <div className="p-2 rounded-[8px]" style={{ backgroundColor: ACCENT_SOFT }}>
                <CreditCard className="w-4 h-4" style={{ color: ACCENT } as any} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#312B1E]">Linked bank account</div>
                <div className="text-[11px] text-[#8D8476] mt-0.5">Visa •••• 4242</div>
              </div>
            </div>

            <button type="submit"
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-[12px] text-[13.5px] font-bold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_6px_16px_rgba(40,122,85,0.25)]"
              style={{ background: ACCENT }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add {amount || "0.00"} {currency}</>}
            </button>

            <p className="text-[11px] text-center text-[#8D8476]">Funds are typically available instantly.</p>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}