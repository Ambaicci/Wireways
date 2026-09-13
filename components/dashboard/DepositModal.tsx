"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Building2, CreditCard, Smartphone, ArrowRight } from "lucide-react";

export interface Props {
  currency: string;
  flag: string;
  onClose: () => void;
}

export default function DepositModal({ currency, flag, onClose }: Props) {
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "card" | "mobile">("bank");

   const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setStep("processing");
    
    try {
      // Call our real backend deposit route
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          currency, 
          method 
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Deposit Initiated:", data.paymentIntentId);
        // In a real app, you would now use data.clientSecret with Stripe.js or similar
        setStep("success");
      } else {
        console.error("Deposit failed:", data.error);
        alert("Failed to initiate deposit. Please try again.");
        setStep("input");
      }
    } catch (error) {
      console.error("Network error during deposit:", error);
      alert("Network error. Please check your connection.");
      setStep("input");
    }
  };

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl border border-neutral-100 overflow-hidden"
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E5EA] flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{flag}</span>
            <div>
              <h3 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight">Add Funds</h3>
              <p className="text-[12px] text-[#86868B]">{currency} Wallet</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Amount Input */}
                <div>
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Amount to Deposit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#86868B]">
                      {currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[14px] pl-10 pr-4 py-3.5 text-[18px] font-semibold outline-none focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all text-[#1D1D1F]"
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-3 block">Select Method</label>
                  <div className="space-y-2">
                    {[
                      { id: "bank", label: "Bank Transfer", desc: "1-2 business days", icon: Building2, color: "#4C5C88" },
                      { id: "card", label: "Credit / Debit Card", desc: "Instant", icon: CreditCard, color: "#F1622C" },
                      { id: "mobile", label: "Mobile Money", desc: "Instant (M-Pesa, etc.)", icon: Smartphone, color: "#287A55" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id as any)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-[14px] border transition-all ${
                          method === m.id
                            ? "bg-[#F1622C]/5 border-[#F1622C] ring-1 ring-[#F1622C]"
                            : "bg-white border-[#E5E5EA] hover:border-[#D1D1D6]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center shadow-sm">
                            <m.icon className="w-4 h-4" style={{ color: m.color }} />
                          </div>
                          <div className="text-left">
                            <p className="text-[14px] font-semibold text-[#1D1D1F]">{m.label}</p>
                            <p className="text-[11px] text-[#86868B]">{m.desc}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          method === m.id ? "bg-[#F1622C] border-[#F1622C]" : "border-[#D1D1D6]"
                        }`}>
                          {method === m.id && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleDeposit}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-[#1D1D1F] text-white py-3.5 rounded-[14px] text-[15px] font-semibold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/5 mt-2"
                >
                  Continue to Deposit <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 text-center space-y-4"
              >
                <Loader2 className="w-10 h-10 text-[#F1622C] animate-spin mx-auto" />
                <h4 className="text-[18px] font-bold text-[#1D1D1F]">Processing Deposit</h4>
                <p className="text-[14px] text-[#86868B]">
                  Securing your {formatCurrency(amount)} {currency} transaction...
                </p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-[#E7F2EC] mx-auto"
                >
                  <Check className="w-7 h-7 text-[#287A55]" strokeWidth={3} />
                </motion.div>
                <h4 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">Deposit Initiated!</h4>
                <p className="text-[14px] text-[#86868B] leading-relaxed max-w-[280px] mx-auto">
                  Your deposit of <span className="font-semibold text-[#1D1D1F]">{formatCurrency(amount)} {currency}</span> is being processed. You will be notified once the funds are available.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-[#1D1D1F] text-white font-semibold rounded-[14px] hover:bg-black transition-colors mt-4"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}