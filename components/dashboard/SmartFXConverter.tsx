"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { requestSmartFXQuote, confirmSmartFXConversion } from "@/lib/actions";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

export default function SmartFXConverter() {
  const [step, setStep] = useState<"input" | "quote" | "result">("input");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("KES");
  const [amount, setAmount] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [wicMessage, setWicMessage] = useState<any>(null);

  // Countdown timer for the rate lock
  useEffect(() => {
    if (step !== "quote" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuoteExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleGetQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setWicMessage(null);

    const res = await requestSmartFXQuote({ fromCurrency, toCurrency, amount: parseFloat(amount) });
    setIsLoading(false);

    if (res.success && res.quoteId) {
      setQuoteId(res.quoteId);
      setConvertedAmount(res.convertedAmount || 0);
      setWicMessage(res.message);
      setTimeLeft(60);
      setStep("quote");
    } else {
      setWicMessage(res.message || { headline: "Error", body: "Failed to get quote.", tone: "error" });
      setStep("result");
    }
  };

  const handleConfirm = async () => {
    if (!quoteId) return;
    setIsLoading(true);
    setWicMessage(null);

    const res = await confirmSmartFXConversion({ quoteId });
    setIsLoading(false);

    setWicMessage(res.message);
    setStep("result");
  };

  const handleQuoteExpired = () => {
    setWicMessage({
      headline: "Rate lock expired.",
      body: "The 60-second window passed. Please request a fresh rate.",
      tone: "warning"
    });
    setStep("result");
  };

  const handleReset = () => {
    setStep("input");
    setAmount("");
    setQuoteId(null);
    setConvertedAmount(null);
    setWicMessage(null);
    setTimeLeft(60);
  };

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-[20px] p-6 shadow-sm max-w-[480px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F1622C]/10 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-[#F1622C]" />
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-[#312B1E]">Smart FX Conversion</h2>
          <p className="text-[12px] text-[#8D8476]">Protected by WIC rate-locking.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.form 
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleGetQuote} 
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-wider mb-1 block">From</label>
                <select 
                  value={fromCurrency} 
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full border border-[#E8E0D4] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#F1622C] bg-white"
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-wider mb-1 block">To</label>
                <select 
                  value={toCurrency} 
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full border border-[#E8E0D4] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#F1622C] bg-white"
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#AAA092] uppercase tracking-wider mb-1 block">Amount</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                required
                className="w-full border border-[#E8E0D4] rounded-xl px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] bg-white"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !amount}
              className="w-full bg-[#312B1E] text-white py-3 rounded-xl text-[13px] font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Get Locked Quote <ArrowRightLeft className="w-4 h-4" /></>}
            </button>
          </motion.form>
        )}

        {step === "quote" && (
          <motion.div 
            key="quote"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-5"
          >
            {/* The Countdown */}
            <div className="flex items-center justify-between bg-[#FFFDF9] border border-[#E8E0D4] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[#312B1E]">
                <Clock className="w-4 h-4 text-[#F1622C]" />
                <span className="text-[13px] font-semibold">Rate locked</span>
              </div>
              <span className={`text-[14px] font-bold tabular-nums ${timeLeft < 15 ? "text-[#C53030]" : "text-[#287A55]"}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>

            {/* The Quote Details */}
            <div className="text-center space-y-1 py-2">
              <p className="text-[12px] text-[#8D8476]">You send</p>
              <p className="text-[24px] font-bold text-[#312B1E] tabular-nums">{parseFloat(amount).toLocaleString()} {fromCurrency}</p>
              <ArrowRightLeft className="w-4 h-4 text-[#A8A29E] mx-auto my-2" />
              <p className="text-[12px] text-[#8D8476]">You receive (Locked)</p>
              <p className="text-[24px] font-bold text-[#287A55] tabular-nums">{convertedAmount?.toLocaleString()} {toCurrency}</p>
            </div>

            {/* WIC Message */}
            {wicMessage && (
              <div className={`p-3 rounded-xl border text-[12px] ${
                wicMessage.tone === "info" ? "bg-[#EAEDF3] border-[#4C5C88]/20 text-[#4C5C88]" : "bg-[#FFFDF9] border-[#E8E0D4] text-[#6E665A]"
              }`}>
                <p className="font-bold mb-0.5">{wicMessage.headline}</p>
                <p className="leading-relaxed">{wicMessage.body}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 py-3 rounded-xl border border-[#E8E0D4] text-[13px] font-bold text-[#312B1E] hover:bg-[#F5F5F4]">
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-[#287A55] text-white text-[13px] font-bold hover:bg-[#1E5E41] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm Conversion</>}
              </button>
            </div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-4"
          >
            {wicMessage?.tone === "success" ? (
              <CheckCircle2 className="w-12 h-12 text-[#287A55] mx-auto" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-[#C53030] mx-auto" />
            )}
            
            <div>
              <h3 className="text-[16px] font-bold text-[#312B1E] mb-1">{wicMessage?.headline}</h3>
              <p className="text-[13px] text-[#8D8476] leading-relaxed">{wicMessage?.body}</p>
            </div>

            <button 
              onClick={handleReset} 
              className="w-full bg-[#312B1E] text-white py-3 rounded-xl text-[13px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> New Conversion
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}