"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { executeSend } from "@/lib/actions";
import WicStar from "./WicStar";

interface Wallet {
  currency: string;
  balance: number;
}

const rails = [
  { id: "MPesa B2C", eta: "~42 ms", fee: 0.4, score: 98 },
  { id: "SEPA Instant", eta: "~10 sec", fee: 1.2, score: 94 },
  { id: "SWIFT gpi", eta: "1-2 days", fee: 15, score: 72 },
];

function railColor(rail: string) {
  const r = (rail || "").toLowerCase();
  if (r.includes("mpesa")) return "#287A55";
  if (r.includes("sepa")) return "#7C8DB5";
  if (r.includes("swift")) return "#7C6B51";
  return "#B3AC9F";
}

export default function SendMoneyModal({
  isOpen,
  onClose,
  wallets,
}: {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [rail, setRail] = useState(rails[0].id);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSuccess(false);
      setProcessing(false);
      setError(null);
      setSource(wallets[0]?.currency || "");
      setAmount("");
      setRecipient("");
      setRail(rails[0].id);
    }
  }, [isOpen]);

  const amountNum = parseFloat(amount) || 0;
  const sourceWallet = wallets.find((w) => w.currency === source);
  const balance = sourceWallet?.balance || 0;
  const selectedRail = rails.find((r) => r.id === rail)!;
  const validStep0 = source !== "" && amountNum > 0 && amountNum <= balance;
  const validStep1 = recipient.trim().length > 0;

  const handleConfirm = async () => {
    setProcessing(true);
    setError(null);
    const res = await executeSend({
      sourceCurrency: source,
      amount: amountNum,
      recipientName: recipient,
      rail,
    });
    setProcessing(false);
    if (res.success) {
      setSuccess(true);
      router.refresh();
    } else {
      setError(res.message || "Execution failed.");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-[#312B1E]/40 backdrop-blur-[7px] flex items-end md:items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#FFFDF9] rounded-t-[23px] md:rounded-[23px] w-full md:max-w-md shadow-[0_30px_90px_rgba(0,0,0,0.25)] border border-[#E8E0D4] overflow-hidden"
        initial={{ y: 40, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-[#F1EADF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <WicStar className="w-4 h-4 text-[#F1622C]" />
              <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[#312B1E]">Send money</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8D8476] hover:bg-[#F5EFE6] hover:text-[#312B1E] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {!success && (
            <div className="flex gap-1.5 mt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-[#F1622C]" : "bg-[#E8E0D4]"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="p-7">
          {success ? (
            /* ═══ SUCCESS — the green seal, inside the card ═══ */
            <div className="py-6 text-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-[#287A55]/15 border border-[#287A55]/60 shadow-[0_0_0_6px_rgba(40,122,85,0.10)]"
              >
                <Check className="w-7 h-7 text-[#287A55]" strokeWidth={3} />
              </motion.span>
              <h4 className="text-[17px] font-bold text-[#312B1E] mt-4">Payment sent</h4>
              <p className="text-[13px] text-[#8D8476] mt-1.5">
                {amountNum.toLocaleString()} {source} → {recipient}
              </p>
              <div className="mt-4 mx-auto max-w-[280px] rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF] text-left">
                <div className="flex justify-between px-4 py-2.5 text-[12px]">
                  <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Rail</span>
                  <span className="flex items-center gap-1.5 font-semibold text-[#51483A]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: railColor(rail) }} />
                    {rail}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-[12px]">
                  <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">ETA</span>
                  <span className="font-semibold text-[#287A55]">{selectedRail.eta}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-[12px]">
                  <span className="text-[#AAA092] font-semibold uppercase tracking-[0.08em] text-[10px]">Fee</span>
                  <span className="font-mono font-semibold text-[#51483A]">${selectedRail.fee.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-6 w-full bg-[#312B1E] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* ═══ Inline error — stays in the card ═══ */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-[12px] border border-[#E7C9BF] bg-[#F9ECE9] px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-[#A84B3D] flex-shrink-0 mt-0.5" />
                  <p className="flex-1 text-[12px] leading-[1.5] text-[#A84B3D] font-semibold">{error}</p>
                  <button onClick={() => setError(null)} className="text-[#A84B3D] hover:text-[#7C3328] transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* STEP 0: Source & Amount */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">From wallet</label>
                    <div className="grid grid-cols-5 gap-2 mt-1.5">
                      {wallets.map((w) => (
                        <button
                          key={w.currency}
                          onClick={() => setSource(w.currency)}
                          className={`rounded-[10px] border px-1 py-2.5 text-[11.5px] font-bold transition-all ${
                            source === w.currency
                              ? "border-[#F1622C] bg-[#F1622C] text-white shadow-[0_6px_16px_rgba(241,98,44,0.25)]"
                              : "border-[#E8E0D4] text-[#6E665A] hover:border-[#D7CABB]"
                          }`}
                        >
                          {w.currency}
                        </button>
                      ))}
                    </div>
                    {sourceWallet && (
                      <p className="text-[11px] text-[#8D8476] mt-2">
                        Available: <span className="font-mono font-semibold text-[#51483A] tabular-nums">{balance.toLocaleString()} {source}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Amount</label>
                    <input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-4 py-3.5 font-mono text-[16px] tabular-nums outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]"
                    />
                    <div className="flex gap-2 mt-2">
                      {[0.25, 0.5, 1].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setAmount((balance * pct).toFixed(2))}
                          className="text-[11px] font-bold text-[#6E5B3E] bg-[#F1EADF] px-2.5 py-1 rounded-full hover:bg-[#6E5B3E] hover:text-white transition-all"
                        >
                          {pct === 1 ? "Max" : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                    {amountNum > balance && (
                      <p className="text-[11.5px] text-[#A84B3D] font-semibold mt-2">Insufficient {source} balance.</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 1: Recipient & Rail */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]">Recipient name</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Acme Corp / Jane Doe"
                      className="mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-4 py-3 text-[14px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em] flex items-center gap-1.5">
                      Routing rail <WicStar className="w-3 h-3 text-[#F1622C]" />
                    </label>
                    <div className="space-y-2 mt-1.5">
                      {rails.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setRail(r.id)}
                          className={`relative w-full flex items-center justify-between rounded-[12px] border px-4 py-3 transition-all overflow-hidden ${
                            rail === r.id
                              ? "border-[#F1622C] bg-[#FFF0E7]"
                              : "border-[#E8E0D4] hover:border-[#D7CABB]"
                          }`}
                        >
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: railColor(r.id), opacity: 0.5 }} />
                          <div className="text-left pl-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold text-[#312B1E]">{r.id}</span>
                              {r.score === 98 && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-[#E84D00] bg-[#FFF0E7] border border-[#F1622C]/30 px-1.5 py-0.5 rounded-full tracking-wider">
                                  <WicStar className="w-2.5 h-2.5" /> WIC PICK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8D8476] mt-0.5">ETA {r.eta}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-[12.5px] font-semibold text-[#51483A] tabular-nums">${r.fee.toFixed(2)}</div>
                            <div className="text-[10px] font-mono text-[#287A55]">score {r.score}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Review — the receipt */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] divide-y divide-dashed divide-[#F1EADF]">
                    <div className="flex justify-between px-5 py-3.5 text-[13px]">
                      <span className="text-[#8D8476]">From</span>
                      <span className="font-mono font-semibold text-[#312B1E] tabular-nums">{amountNum.toLocaleString()} {source}</span>
                    </div>
                    <div className="flex justify-between px-5 py-3.5 text-[13px]">
                      <span className="text-[#8D8476]">To</span>
                      <span className="font-semibold text-[#312B1E]">{recipient}</span>
                    </div>
                    <div className="flex justify-between px-5 py-3.5 text-[13px]">
                      <span className="text-[#8D8476]">Rail</span>
                      <span className="flex items-center gap-1.5 font-semibold text-[#312B1E]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: railColor(rail) }} />
                        {rail}
                      </span>
                    </div>
                    <div className="flex justify-between px-5 py-3.5 text-[13px]">
                      <span className="text-[#8D8476]">Fee</span>
                      <span className="font-mono font-semibold text-[#51483A] tabular-nums">${selectedRail.fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-5 py-3.5 text-[13px]">
                      <span className="text-[#8D8476]">ETA</span>
                      <span className="font-semibold text-[#287A55]">{selectedRail.eta}</span>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-[11px] text-[#8D8476]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#287A55]" />
                    Idempotent execution — this transfer can never double-charge.
                  </p>
                </div>
              )}

              {/* Footer nav */}
              <div className="flex gap-2.5 mt-7">
                {step > 0 && (
                  <button
                    onClick={() => { setStep(step - 1); setError(null); }}
                    className="flex items-center justify-center gap-2 border border-[#E8E0D4] text-[#6E665A] px-4 py-3 rounded-[12px] text-[13px] font-bold hover:border-[#312B1E] hover:text-[#312B1E] transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step < 2 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 ? !validStep0 : !validStep1}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F1622C] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-[#E0531C] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleConfirm}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#287A55] text-white py-3 rounded-[12px] text-[13px] font-bold hover:bg-[#1F5F43] transition-all disabled:opacity-60"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {processing ? "Routing..." : "Confirm & Send"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}