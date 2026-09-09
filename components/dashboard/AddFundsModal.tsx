"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Loader2, Smartphone, CreditCard, Building2, Store, MapPin, Copy } from "lucide-react";
import WicIcon from "@/components/ui/WicIcon";

export default function AddFundsModal({
  isOpen,
  onClose,
  currency = "USD",
  virtualAccount,
}: {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  virtualAccount?: { number: string; bank: string } | null;
}) {
  const [method, setMethod] = useState<"mobile" | "card" | "bank" | "agent">("mobile");
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentCode, setAgentCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAmount("");
      setPhoneNumber("");
      setAgentCode("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  const amountNum = parseFloat(amount) || 0;
  // Prevents the button from being clickable if Bank is selected but no virtual account exists
  const isValid = amountNum > 0 && (method !== "bank" || virtualAccount !== null);

  const handleTopUp = async () => {
    // Double-check to prevent processing if they somehow bypass the disabled state
    if (method === "bank" && !virtualAccount) {
      alert("Bank transfers are not yet available. Please use Mobile Money or Card.");
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setStep(1);
  };

  if (!isOpen) return null;

  const getToggleStyle = () => {
    const index = ["mobile", "card", "bank", "agent"].indexOf(method);
    return {
      left: `calc(${index * 25}% + 4px)`,
      width: "calc(25% - 8px)",
    };
  };

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
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#1D1D1F]">Top Up Wallet</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-[#E5E5EA] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4-Way Segmented Control */}
          <div className="bg-[#E5E5EA] p-1 rounded-[10px] flex relative">
            <motion.div
              layout
              className="absolute top-1 bottom-1 bg-white rounded-[8px] shadow-sm"
              style={getToggleStyle()}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {[
              { id: "mobile", label: "Mobile", icon: Smartphone },
              { id: "card", label: "Card", icon: CreditCard },
              { id: "bank", label: "Bank", icon: Building2 },
              { id: "agent", label: "Agent", icon: Store },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMethod(item.id as any)}
                className={`flex-1 relative z-10 py-2 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors ${
                  method === item.id ? "text-[#1D1D1F]" : "text-[#86868B]"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
          {step === 1 ? (
            /* ═══ SUCCESS STATE (Apple Wallet Style) ═══ */
            <div className="py-8 text-center px-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-[#E7F2EC] mb-5"
              >
                <Check className="w-9 h-9 text-[#287A55]" strokeWidth={3} />
              </motion.div>
              <h4 className="text-[22px] font-bold text-[#1D1D1F] tracking-tight">
                {method === "mobile" || method === "agent" ? "Check your device" : "Funds Added"}
              </h4>
              <p className="text-[15px] text-[#86868B] mt-2 mb-8 leading-relaxed">
                {method === "mobile" 
                  ? `Please confirm the ${amountNum.toLocaleString()} ${currency} STK push.`
                  : method === "agent"
                  ? `Waiting for agent confirmation of ${amountNum.toLocaleString()} ${currency}.`
                  : `${amountNum.toLocaleString()} ${currency} is now in your wallet.`}
              </p>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-[14px] text-[16px] font-semibold bg-[#1D1D1F] text-white hover:bg-black transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          ) : (
            /* ═══ FORM STATE (iOS Inset Grouped) ═══ */
            <>
              {/* Amount Section */}
              <div className="bg-white rounded-[12px] overflow-hidden shadow-sm">
                <div className="p-4">
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Amount to Add</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-bold text-[#1D1D1F]">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent pl-8 pr-4 py-2 font-mono text-[20px] font-bold tabular-nums outline-none text-[#1D1D1F] placeholder:text-[#D1D1D6]"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Method Section */}
              <div className="bg-white rounded-[12px] overflow-hidden shadow-sm">
                {method === "mobile" && (
                  <div className="p-4">
                    <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full bg-transparent px-0 py-2 text-[16px] outline-none text-[#1D1D1F] border-b border-[#E5E5EA] focus:border-[#F1622C] transition-colors placeholder:text-[#D1D1D6]"
                    />
                    <p className="text-[12px] text-[#86868B] mt-3 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-[#287A55]" /> An STK push will be sent to this number.
                    </p>
                  </div>
                )}

                {method === "card" && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full bg-transparent pl-8 pr-4 py-2 text-[16px] outline-none text-[#1D1D1F] border-b border-[#E5E5EA] focus:border-[#F1622C] transition-colors placeholder:text-[#D1D1D6]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Expiry</label>
                        <input type="text" placeholder="MM/YY" className="w-full bg-transparent px-0 py-2 text-[16px] outline-none text-[#1D1D1F] border-b border-[#E5E5EA] focus:border-[#F1622C] transition-colors placeholder:text-[#D1D1D6]" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">CVC</label>
                        <input type="text" placeholder="123" className="w-full bg-transparent px-0 py-2 text-[16px] outline-none text-[#1D1D1F] border-b border-[#E5E5EA] focus:border-[#F1622C] transition-colors placeholder:text-[#D1D1D6]" />
                      </div>
                    </div>
                  </div>
                )}

                {method === "bank" && (
                  <div className="p-4">
                    {virtualAccount ? (
                      <>
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Your Virtual Account</label>
                        <div className="flex items-center justify-between py-2 border-b border-[#E5E5EA]">
                          <div>
                            <div className="text-[16px] font-bold text-[#1D1D1F] font-mono tracking-wider">{virtualAccount.number}</div>
                            <div className="text-[12px] text-[#86868B] mt-0.5">{virtualAccount.bank}</div>
                          </div>
                          <button 
                            onClick={() => navigator.clipboard.writeText(virtualAccount.number)}
                            className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#0071E3] hover:bg-[#E5E5EA] transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[12px] text-[#86868B] mt-3 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[#4C5C88]" /> Transfer the exact amount to this account.
                        </p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto mb-3">
                          <Building2 className="w-6 h-6 text-[#86868B]" />
                        </div>
                        <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-1">Bank Transfers Coming Soon</h4>
                        <p className="text-[13px] text-[#86868B] leading-relaxed max-w-[260px] mx-auto">
                          Virtual account provisioning is currently being finalized. Please use Mobile Money or Card for now.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {method === "agent" && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Agent Code or Phone</label>
                      <input
                        type="text"
                        value={agentCode}
                        onChange={(e) => setAgentCode(e.target.value)}
                        placeholder="e.g., AG-8842 or +254..."
                        className="w-full bg-transparent px-0 py-2 text-[16px] outline-none text-[#1D1D1F] border-b border-[#E5E5EA] focus:border-[#F1622C] transition-colors placeholder:text-[#D1D1D6]"
                      />
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] bg-[#F5F5F7] text-[#1D1D1F] text-[14px] font-semibold hover:bg-[#E5E5EA] transition-all border border-[#E5E5EA]">
                      <MapPin className="w-4 h-4 text-[#F1622C]" /> Find Nearby Agent
                    </button>
                    <p className="text-[12px] text-[#86868B] flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-[#9C6B08]" /> Pay cash at any authorized Wireways retailer.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleTopUp}
                disabled={!isValid || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-[#1D1D1F] text-white py-4 rounded-[14px] text-[16px] font-semibold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/10 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {isProcessing ? "Processing..." : `Top Up ${amountNum > 0 ? amountNum.toLocaleString() + " " + currency : "Wallet"}`}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}