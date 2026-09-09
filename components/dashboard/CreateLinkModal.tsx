"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Loader2, Link2, User, Mail, CreditCard, Building2, Smartphone, Copy, Share2 } from "lucide-react";
import WicIcon from "@/components/ui/WicIcon";

export default function CreateLinkModal({
  isOpen,
  onClose,
  contacts,
}: {
  isOpen: boolean;
  onClose: () => void;
  contacts: { id: string; name: string; email: string }[];
}) {
  const [mode, setMode] = useState<"internal" | "external">("external");
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [rails, setRails] = useState({ mpesa: true, card: true, bank: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [shareLabel, setShareLabel] = useState("Share");

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setRecipient("");
      setSelectedContactId("");
      setAmount("");
      setDescription("");
      setRails({ mpesa: true, card: true, bank: false });
      setIsProcessing(false);
      setLinkUrl("");
    }
  }, [isOpen]);

  const amountNum = parseFloat(amount) || 0;
  const isValid = mode === "internal" 
    ? selectedContactId !== "" && amountNum > 0 
    : recipient.includes("@") && amountNum > 0;

  const handleCreate = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLinkUrl(`https://pay.wireways.com/req/${Math.random().toString(36).substring(7)}`);
    setIsProcessing(false);
    setStep(1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Request via Wireways',
          text: description || 'Please pay this invoice',
          url: linkUrl,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(linkUrl);
      setShareLabel("Copied!");
      setTimeout(() => setShareLabel("Share"), 2000);
    }
  };

  const toggleRail = (rail: keyof typeof rails) => {
    setRails((prev) => ({ ...prev, [rail]: !prev[rail] }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-end md:items-center justify-center z-[60] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-t-[28px] md:rounded-[28px] w-full md:max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-[#D1D1D6] overflow-hidden max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial={{ y: 40, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E5EA] bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <WicIcon className="w-5 h-5 text-[#F1622C]" />
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#1D1D1F]">Request Payment</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 ? (
            /* ═══ SUCCESS STATE ═══ */
            <div className="py-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-[#E7F2EC] mb-4"
              >
                <Check className="w-7 h-7 text-[#287A55]" strokeWidth={3} />
              </motion.div>
              <h4 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">
                {mode === "internal" ? "Request Sent" : "Link Created"}
              </h4>
              <p className="text-[14px] text-[#86868B] mt-2 mb-6 leading-relaxed">
                {mode === "internal" 
                  ? `${amountNum.toLocaleString()} ${currency} requested from ${contacts.find(c => c.id === selectedContactId)?.name}.`
                  : "Share this link with your client to collect payment."}
              </p>

              {mode === "external" && (
                <div className="mx-auto max-w-[320px] rounded-[14px] bg-[#F5F5F7] p-3 flex items-center justify-between gap-2 mb-6 border border-[#E5E5EA]">
                  <span className="text-[13px] font-medium text-[#1D1D1F] truncate px-2 font-mono">{linkUrl}</span>
                  <button className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] hover:bg-[#F5F5F7] transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-[14px] text-[15px] font-semibold bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all border border-[#E5E5EA]"
                >
                  Done
                </button>
                {mode === "external" && (
                  <button 
                    onClick={handleShare} 
                    className="flex-1 py-3.5 rounded-[14px] text-[15px] font-semibold bg-[#1D1D1F] text-white hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> {shareLabel}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ═══ FORM STATE (iOS STYLE) ═══ */
            <>
              {/* Mode Toggle */}
              <div className="bg-[#F5F5F7] p-1 rounded-[12px] flex relative border border-[#E5E5EA]">
                <motion.div
                  layout
                  className="absolute top-1 bottom-1 bg-white rounded-[10px] shadow-sm border border-[#E5E5EA]"
                  style={{ left: mode === "internal" ? "4px" : "50%", width: "calc(50% - 4px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button onClick={() => setMode("internal")} className={`flex-1 relative z-10 py-2 text-[13px] font-semibold transition-colors ${mode === "internal" ? "text-[#1D1D1F]" : "text-[#86868B]"}`}>
                  <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Internal
                </button>
                <button onClick={() => setMode("external")} className={`flex-1 relative z-10 py-2 text-[13px] font-semibold transition-colors ${mode === "external" ? "text-[#1D1D1F]" : "text-[#86868B]"}`}>
                  <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> External
                </button>
              </div>

              {/* Grouped Inputs Container */}
              <div className="bg-[#F5F5F7] rounded-[16px] overflow-hidden border border-[#E5E5EA]">
                
                {/* Recipient */}
                <div className="p-4 border-b border-[#E5E5EA]">
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">
                    {mode === "internal" ? "Select Contact" : "Email Address"}
                  </label>
                  {mode === "internal" ? (
                    <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                      {contacts.length === 0 ? (
                        <p className="text-[13px] text-[#86868B] text-center py-4">No other Wireways users found.</p>
                      ) : (
                        contacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedContactId(c.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-[10px] transition-all text-left ${
                              selectedContactId === c.id ? "bg-white shadow-sm" : "hover:bg-[#E5E5EA]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-[#1D1D1F] flex items-center justify-center text-[11px] font-bold text-white">
                                {c.name.charAt(0)}
                              </div>
                              <span className="text-[14px] font-semibold text-[#1D1D1F]">{c.name}</span>
                            </div>
                            {selectedContactId === c.id && <Check className="w-4 h-4 text-[#F1622C]" />}
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full bg-white rounded-[10px] px-4 py-3 text-[15px] outline-none border border-[#E5E5EA] focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all text-[#1D1D1F]"
                    />
                  )}
                </div>

                {/* Amount & Currency Row */}
                <div className="p-4 border-b border-[#E5E5EA] flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#86868B]">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white rounded-[10px] pl-8 pr-4 py-3 font-mono text-[15px] tabular-nums outline-none border border-[#E5E5EA] focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all text-[#1D1D1F]"
                      />
                    </div>
                  </div>
                  <div className="w-28">
                    <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white rounded-[10px] px-4 py-3 text-[14px] font-bold outline-none border border-[#E5E5EA] focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all text-[#1D1D1F] appearance-none"
                    >
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4">
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 block">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Invoice #1024 / Lunch"
                    className="w-full bg-white rounded-[10px] px-4 py-3 text-[15px] outline-none border border-[#E5E5EA] focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all text-[#1D1D1F]"
                  />
                </div>
              </div>

              {/* Payment Rails (External Only) */}
              {mode === "external" && (
                <div>
                  <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-3 block">Accept Payment Via</label>
                  <div className="bg-[#F5F5F7] rounded-[16px] overflow-hidden border border-[#E5E5EA]">
                    {[
                      { id: "mpesa", label: "M-Pesa", icon: Smartphone, color: "#287A55" },
                      { id: "card", label: "Credit / Debit Card", icon: CreditCard, color: "#4C5C88" },
                      { id: "bank", label: "Bank Transfer", icon: Building2, color: "#9C6B08" },
                    ].map((rail, idx) => (
                      <button
                        key={rail.id}
                        onClick={() => toggleRail(rail.id as keyof typeof rails)}
                        className={`w-full flex items-center justify-between p-4 transition-all ${idx < 2 ? "border-b border-[#E5E5EA]" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5EA] flex items-center justify-center shadow-sm">
                            <rail.icon className="w-4 h-4" style={{ color: rail.color }} />
                          </div>
                          <span className="text-[14px] font-semibold text-[#1D1D1F]">{rail.label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          rails[rail.id as keyof typeof rails] ? "bg-[#F1622C] border-[#F1622C]" : "border-[#D1D1D6] bg-white"
                        }`}>
                          {rails[rail.id as keyof typeof rails] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleCreate}
                disabled={!isValid || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-[#1D1D1F] text-white py-4 rounded-[16px] text-[15px] font-semibold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/5"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {isProcessing ? "Processing..." : mode === "internal" ? "Send Request" : "Create Payment Link"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}