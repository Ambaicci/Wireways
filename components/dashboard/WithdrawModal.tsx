"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, Check, Loader2, Building2, Smartphone, Store, AlertCircle, ArrowUpRight } from "lucide-react";
import WicIcon from "@/components/ui/WicIcon";

export default function WithdrawModal({
  isOpen,
  onClose,
  currency = "USD",
  availableBalance = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  availableBalance?: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "mobile" | "agent">("bank");
  const [recipient, setRecipient] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAmount("");
      setRecipient("");
      setIsProcessing(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const amountNum = parseFloat(amount) || 0;
  const isValid = amountNum > 0 && amountNum <= availableBalance && recipient.trim().length > 0;

  // Contextual Success Message Generator
  const getSuccessMessage = () => {
    const formattedAmount = `${currency} ${amountNum.toLocaleString()}`;
    if (method === "mobile") return `Successfully withdrawn ${formattedAmount} to M-PESA account ${recipient}.`;
    if (method === "agent") return `Successfully withdrawn ${formattedAmount} through Wireways Agent ${recipient} for cash pickup.`;
    return `Successfully withdrawn ${formattedAmount} to bank account ${recipient}.`;
  };

  const handleWithdraw = async () => {
    setErrorMessage(null);

    if (amountNum <= 0) return;
    if (amountNum > availableBalance) {
      setErrorMessage("Insufficient balance");
      return;
    }
    if (!recipient.trim()) {
      setErrorMessage("Please enter recipient details");
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: amountNum, 
          currency, 
          method,
          recipient: recipient.trim()
        }),
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = { error: "Server returned an invalid response" };
      }

      if (data.success) {
        router.refresh();
        setStep(1);
      } else {
        setErrorMessage(data.error || "Failed to process withdrawal");
        setIsProcessing(false);
      }
    } catch (error) {
      setErrorMessage("Network error. Please check your connection.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-end md:items-center justify-center z-[60] p-0 md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#F2F2F7] rounded-t-[28px] md:rounded-[28px] w-full md:max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden max-h-[90vh] flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial={{ y: 40, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-[#F2F2F7] flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <WicIcon className="w-5 h-5 text-[#F1622C]" />
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#1D1D1F]">Withdraw Funds</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-[#E5E5EA] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Balance Display */}
          <div className="bg-white rounded-[12px] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Available Balance</span>
              <span className="text-[18px] font-bold text-[#1D1D1F] tabular-nums">
                {availableBalance.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
          {step === 1 ? (
            /* ═══ SUCCESS STATE ═══ */
            <div className="py-10 text-center px-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-[#E7F2EC] mb-6"
              >
                <Check className="w-9 h-9 text-[#287A55]" strokeWidth={3} />
              </motion.div>
              <h4 className="text-[22px] font-bold text-[#1D1D1F] tracking-tight mb-3">Withdrawal Successful</h4>
              
              {/* Contextual Message Box */}
              <div className="bg-white rounded-[16px] p-4 mb-8 shadow-sm border border-[#E5E5EA]">
                <p className="text-[14px] text-[#1D1D1F] leading-relaxed font-medium">
                  {getSuccessMessage()}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-[14px] text-[16px] font-semibold bg-[#1D1D1F] text-white hover:bg-black transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          ) : (
            /* ═══ FORM STATE ═══ */
            <>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-[12px] p-3 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5 flex-shrink-0" />
                  <p className="text-[13px] text-[#DC2626] leading-relaxed flex-1">{errorMessage}</p>
                  <button onClick={() => setErrorMessage(null)} className="text-[#DC2626] hover:text-[#991B1B]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              {/* Method Selection */}
              <div className="bg-white rounded-[12px] overflow-hidden shadow-sm">
                <div className="p-4">
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-3 block">Withdraw To</label>
                  <div className="space-y-2">
                    {[
                      { id: "bank", label: "Bank Account", icon: Building2, color: "#4C5C88" },
                      { id: "mobile", label: "Mobile Money", icon: Smartphone, color: "#287A55" },
                      { id: "agent", label: "Wireways Agent", icon: Store, color: "#9C6B08" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id as any)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-[10px] border transition-all ${
                          method === m.id ? "bg-[#F1622C]/5 border-[#F1622C]" : "bg-white border-[#E5E5EA]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5EA] flex items-center justify-center shadow-sm">
                            <m.icon className="w-4 h-4" style={{ color: m.color }} />
                          </div>
                          <span className="text-[14px] font-semibold text-[#1D1D1F]">{m.label}</span>
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
              </div>

              {/* Amount Input */}
              <div className="bg-white rounded-[12px] overflow-hidden shadow-sm">
                <div className="p-4">
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-bold text-[#1D1D1F]">
                      {currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      max={availableBalance}
                      className="w-full bg-transparent pl-8 pr-4 py-2 font-mono text-[20px] font-bold tabular-nums outline-none text-[#1D1D1F] placeholder:text-[#D1D1D6]"
                    />
                  </div>
                  {amountNum > availableBalance && (
                    <p className="text-[12px] text-[#DC2626] mt-2">Amount exceeds available balance</p>
                  )}
                </div>
              </div>

              {/* Recipient Input */}
              <div className="bg-white rounded-[12px] overflow-hidden shadow-sm">
                <div className="p-4">
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">
                    {method === "bank" ? "Account Number / Name" : method === "mobile" ? "Phone Number" : "Agent Name / Code"}
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={method === "bank" ? "e.g. 7846447888 AMBAICCI" : method === "mobile" ? "e.g. 0723489878" : "e.g. TELEMULLAH LTD"}
                    className="w-full bg-transparent px-0 py-2 text-[16px] outline-none text-[#1D1D1F] border-b border-[#E5E5EA] focus:border-[#F1622C] transition-colors placeholder:text-[#D1D1D6]"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleWithdraw}
                disabled={!isValid || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-[#1D1D1F] text-white py-4 rounded-[14px] text-[16px] font-semibold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/10 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
                {isProcessing ? "Processing..." : `Withdraw ${amountNum > 0 ? amountNum.toLocaleString() + " " + currency : "Funds"}`}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}