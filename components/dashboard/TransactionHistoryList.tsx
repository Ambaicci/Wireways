"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDownLeft, ArrowUpRight, X, Calendar, Hash, 
  CheckCircle2, Clock, AlertCircle, Repeat, Plus
} from "lucide-react";

export default function TransactionHistoryList({ 
  transactions, 
  currency 
}: { 
  transactions: any[]; 
  currency: string; 
}) {
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const formatAmount = (amount: number) => {
    if (currency === 'USDC') return `${amount.toLocaleString()} USDC`;
    if (currency === 'KES') return `KSh ${amount.toLocaleString()}`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "Completed") return <CheckCircle2 className="w-3 h-3 text-[#287A55]" />;
    if (status === "Pending") return <Clock className="w-3 h-3 text-[#9C6B08]" />;
    return <AlertCircle className="w-3 h-3 text-[#DC2626]" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-[#E7F2EC] text-[#287A55]";
    if (status === "Pending") return "bg-[#FFF8E1] text-[#9C6B08]";
    return "bg-[#FEE2E2] text-[#DC2626]";
  };

  // Helper to prefill the AI dock for the "Repeat" action
  const handleRepeatWithWic = () => {
    if (typeof window !== "undefined" && selectedTx) {
      window.dispatchEvent(new CustomEvent("prefill-ai-dock", { 
        detail: `Repeat transaction ${selectedTx.name}` 
      }));
    }
    setSelectedTx(null);
  };

  return (
    <>
      {/* Transaction List */}
      <div className="space-y-1">
        {transactions.map((tx) => (
          <div 
            key={tx.id} 
            onClick={() => setSelectedTx(tx)}
            className="group flex items-center gap-4 py-3.5 border-b border-[#F5F5F7] last:border-0 hover:bg-[#FAFAFA] rounded-lg px-2 -mx-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${tx.type === "in" ? "bg-[#E7F2EC] border-[#287A55]/20" : "bg-[#F5F5F7] border-[#E5E5EA]"}`}>
              {tx.type === "in" ? (
                <ArrowDownLeft className="w-4 h-4 text-[#287A55]" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-[#86868B]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#1D1D1F] truncate">{tx.name}</div>
              <div className="text-[12px] font-medium text-[#86868B] mt-0.5">{tx.rail} · {new Date(tx.created_at).toLocaleDateString()}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-bold text-[14px] tabular-nums ${tx.type === "in" ? "text-[#287A55]" : "text-[#1D1D1F]"}`}>
                {tx.type === "in" ? "+" : "−"}{formatAmount(tx.amount)}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5 inline-block ${getStatusColor(tx.status)}`}>
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Detail Modal (Wireways Style) */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-4 md:p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white rounded-[24px] w-full max-w-[420px] shadow-[0_32px_80px_rgba(0,0,0,0.25)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 pt-6 pb-4 flex items-start gap-4 relative">
                {/* Icon Box */}
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${selectedTx.type === "in" ? "bg-[#E7F2EC]" : "bg-[#F5F5F7]"}`}>
                  {selectedTx.type === "in" ? (
                    <ArrowDownLeft className="w-5 h-5 text-[#287A55]" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-[#1D1D1F]" />
                  )}
                </div>

                {/* Title & Status */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-[15px] font-bold text-[#1D1D1F] tracking-tight truncate pr-6">
                    {selectedTx.name}
                  </h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1.5 ${getStatusColor(selectedTx.status)}`}>
                    {getStatusIcon(selectedTx.status)}
                    {selectedTx.status}
                  </div>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="absolute top-6 right-6 w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B] hover:bg-[#E5E5EA] hover:text-[#1D1D1F] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 pb-6 space-y-5">
                {/* Large Amount */}
                <div className={`text-[32px] font-bold tabular-nums tracking-tight ${selectedTx.type === "in" ? "text-[#287A55]" : "text-[#1D1D1F]"}`}>
                  {selectedTx.type === "in" ? "+" : "−"}{formatAmount(selectedTx.amount).replace(/^[^\d]*/, '')}
                </div>

                {/* Details Grid with Dotted Lines */}
                <div className="space-y-0">
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5EA]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Date</span>
                    <span className="text-[13px] font-semibold text-[#1D1D1F]">{formatFullDate(selectedTx.created_at)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5EA]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Routing Rail</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#86868B]" />
                      <span className="text-[13px] font-semibold text-[#1D1D1F]">{selectedTx.rail || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-dashed border-[#E5E5EA]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Direction</span>
                    <span className="text-[13px] font-semibold text-[#1D1D1F]">{selectedTx.type === "in" ? "Inflow" : "Outflow"}</span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Reference</span>
                    <span className="text-[13px] font-mono font-semibold text-[#1D1D1F]">
                      #{selectedTx.id}
                    </span>
                  </div>
                </div>

                {/* AI Suggestion Box */}
                <div className="bg-[#FDEBE0] rounded-[12px] p-3.5 flex items-center gap-3">
                  <Plus className="w-4 h-4 text-[#F1622C] flex-shrink-0" />
                  <p className="text-[13px] font-medium text-[#D4511E] leading-tight">
                    WIC can repeat this in one tap.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="flex-1 py-3 rounded-[12px] text-[14px] font-semibold bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleRepeatWithWic}
                    className="flex-1 py-3 rounded-[12px] text-[14px] font-semibold bg-[#F1622C] text-white hover:bg-[#D4511E] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Repeat className="w-4 h-4" />
                    Repeat with WIC
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}