"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { closeWallet } from "@/lib/actions";

const currencies = ["USD", "EUR", "GBP", "USDC", "KES"];

export default function CloseWalletModal({ 
  currency, 
  balance,
  isOpen, 
  onClose 
}: { 
  currency: string; 
  balance: number;
  isOpen: boolean; 
  onClose: () => void;
}) {
  const router = useRouter();
  const [targetCurrency, setTargetCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await closeWallet({ currency, targetCurrency });
    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        onClose();
        router.push("/wallets"); // Redirect to wallets list after closing
      }, 2000);
    } else {
      alert(result.message);
    }
  };

  if (!isOpen) return null;

  const availableCurrencies = currencies.filter(c => c !== currency);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#E4E6EB] rounded-[24px] w-full max-w-[440px] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5F6F8]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-sans text-[20px] font-semibold text-[#0E1116] tracking-tight">Close Wallet</h2>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Permanently remove your {currency} wallet</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-[#F5F6F8] text-[#6B7280] hover:text-[#0E1116] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {success ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
              </motion.div>
              <p className="text-lg font-medium text-[#0E1116]">Wallet Closed!</p>
              <p className="text-sm text-[#6B7280] mt-2">Your {currency} wallet has been closed and funds converted to {targetCurrency}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="bg-red-50 border border-red-100 rounded-[16px] p-4">
                <p className="text-sm text-red-700 leading-relaxed">
                  You are about to permanently close your <strong>{currency}</strong> wallet. 
                  {balance > 0 && (
                    <> Your remaining balance of <strong>{balance.toLocaleString()} {currency}</strong> will be automatically converted and transferred to your selected wallet below.</>
                  )}
                </p>
              </div>

              {balance > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-[#9CA1AB] uppercase tracking-wider mb-2 block">
                    Convert funds to
                  </label>
                  <select 
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="w-full bg-white border border-[#E4E6EB] rounded-[12px] p-3 text-[14px] font-medium text-[#0E1116] outline-none cursor-pointer focus:border-[#0E1116] transition-colors"
                  >
                    {availableCurrencies.map(c => (
                      <option key={c} value={c}>{c} Wallet</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-4 rounded-[14px] text-[15px] font-semibold hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Close {currency} Wallet
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-[13px] font-medium text-[#6B7280] hover:text-[#0E1116] transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}