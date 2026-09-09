"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Smartphone, Lock, CheckCircle2, ShieldCheck, AlertTriangle, Building2, User } from "lucide-react";
import { payPaymentLink } from "@/lib/actions";
import { formatCurrency } from "@/lib/constants";

// Browser-compatible UUID generator for idempotency
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function BrandMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

interface PayLink {
  id: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  merchantName: string;
  merchantCompany: string | null;
}

export default function PaymentCheckout({ link }: { link: PayLink }) {
  const [method, setMethod] = useState<"card" | "mpesa">("card");
  const [payerName, setPayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  // CRITICAL: Generate a unique session ID on mount for idempotency
  const [checkoutSessionId] = useState(() => generateUUID());

  // Use centralized, deterministic formatting
  const displayAmount = formatCurrency(link.amount, link.currency);
  const payeeName = link.merchantCompany || link.merchantName || "Merchant";

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  // Client-side validation to prevent unnecessary backend calls
  const isCardValid = cardNumber.replace(/\s/g, "").length >= 15 && expiry.length === 5 && cvc.length >= 3;
  const isMpesaValid = phone.replace(/\s/g, "").length >= 10;
  const isFormValid = method === "card" ? (isCardValid && payerName.trim().length > 0) : isMpesaValid;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    setIsProcessing(true);

    const result = await payPaymentLink({
      linkId: link.id,
      payerName: method === "card" ? payerName : phone,
      method: method === "card" ? "Card" : "M-Pesa",
      idempotencyKey: checkoutSessionId, // CRITICAL: Prevents double-charging on refresh
    });

    setIsProcessing(false);
    
    if (result.success) {
      setPaid(true);
    } else {
      setError(result.message || "Payment failed. Please try again.");
    }
  };

  if (paid) {
    return (
      <main className="min-h-screen bg-[#F6F5F3] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white border border-[#EAE6DF] rounded-3xl p-10 shadow-xl max-w-[420px] w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
            className="w-16 h-16 mx-auto bg-[#E7F5EC] rounded-full flex items-center justify-center mb-5"
          >
            <CheckCircle2 className="w-8 h-8 text-[#287A55]" />
          </motion.div>
          <h1 className="text-xl font-semibold text-[#18140F] tracking-tight">Payment successful</h1>
          <p className="text-sm text-[#8C8579] mt-2">
            {displayAmount} has been securely sent to {payeeName}.
          </p>
          <p className="mt-6 text-[11px] text-[#B3AC9F]">A receipt has been generated • Powered by Wireways</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F5F3] relative flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="fixed top-[-10%] left-[15%] w-[500px] h-[500px] bg-[#F1622C]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[15%] w-[400px] h-[400px] bg-[#4C5C88]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-8 relative">
        <div className="w-9 h-9 bg-[#F1622C] rounded-xl flex items-center justify-center shadow-lg shadow-[#F1622C]/30">
          <BrandMark className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[16px] font-semibold text-[#18140F] tracking-tight leading-none">Wireways</div>
          <div className="text-[11px] text-[#8C8579] mt-0.5">Secure Checkout</div>
        </div>
      </div>

      <div className="w-full max-w-[420px] relative">
        <div className="bg-white border border-[#EAE6DF] rounded-t-3xl p-6 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-[#8C8579]">
            {link.merchantCompany ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            <span className="text-[13px] font-medium">Pay {payeeName}</span>
          </div>
          <p className="text-[12px] text-[#B3AC9F] mb-2">{link.description || "Payment Request"}</p>
          <div className="text-[40px] font-semibold tracking-tight text-[#18140F] tabular-nums">
            {displayAmount}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-[#8C8579]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#287A55]" />
            Protected by Wireways Idempotent Execution
          </div>
        </div>

        <form onSubmit={handlePay} className="bg-white border-t-0 border border-[#EAE6DF] rounded-b-3xl p-6 shadow-xl shadow-[#18140F]/5 space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F5F3] rounded-xl">
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                method === "card" ? "bg-white text-[#18140F] shadow-sm" : "text-[#8C8579] hover:text-[#4E4841]"
              }`}
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
            <button
              type="button"
              onClick={() => setMethod("mpesa")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                method === "mpesa" ? "bg-white text-[#18140F] shadow-sm" : "text-[#8C8579] hover:text-[#4E4841]"
              }`}
            >
              <Smartphone className="w-4 h-4" /> M-Pesa
            </button>
          </div>

          {method === "card" ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Name on card</label>
                <input
                  type="text"
                  required
                  autoComplete="cc-name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1.5 w-full border border-[#EAE6DF] rounded-xl px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] transition-colors bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Card number</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  className="mt-1.5 w-full border border-[#EAE6DF] rounded-xl px-3.5 py-3 text-[14px] font-mono outline-none focus:border-[#F1622C] transition-colors bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Expiry</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="mt-1.5 w-full border border-[#EAE6DF] rounded-xl px-3.5 py-3 text-[14px] font-mono outline-none focus:border-[#F1622C] transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">CVC</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className="mt-1.5 w-full border border-[#EAE6DF] rounded-xl px-3.5 py-3 text-[14px] font-mono outline-none focus:border-[#F1622C] transition-colors bg-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">M-Pesa phone number</label>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, "").slice(0, 16))}
                placeholder="0712 345 678"
                className="mt-1.5 w-full border border-[#EAE6DF] rounded-xl px-3.5 py-3 text-[14px] font-mono outline-none focus:border-[#F1622C] transition-colors bg-white"
              />
              <p className="text-[11px] text-[#8C8579] mt-2">You will receive an STK push prompt on your phone to confirm the payment.</p>
            </div>
          )}

          {error && (
            <div className="text-[12px] text-[#C53030] bg-[#C53030]/5 border border-[#C53030]/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !isFormValid}
            className="w-full bg-[#F1622C] text-white py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#D4511E] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#F1622C]/25 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-100" />
                <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-200" />
              </span>
            ) : (
              `Pay ${displayAmount}`
            )}
          </button>

          <p className="text-center text-[11px] text-[#B3AC9F] flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Payments are encrypted end-to-end
          </p>
        </form>
      </div>

      <p className="mt-8 text-[11px] text-[#B3AC9F] relative">Powered by Wireways • AI Smart Routing</p>
    </main>
  );
}