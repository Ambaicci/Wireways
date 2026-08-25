"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ArrowRight, BrainCircuit } from "lucide-react";

interface ConversionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversionDetailsModal({ isOpen, onClose }: ConversionDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#18140F]/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#EAE6DF] rounded-[20px] w-full max-w-[480px] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1EEE8]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E7F5EC] rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-[#17824A]" />
              </div>
              <div>
                <h2 className="font-sans text-[18px] font-semibold text-[#18140F] tracking-tight">Auto-Conversion Executed</h2>
                <p className="text-[12px] text-[#8C8579] mt-0.5">Completed 2 minutes ago</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-[#FAFAF9] text-[#8C8579] hover:text-[#18140F] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* Conversion Flow */}
            <div className="flex items-center justify-between bg-[#FAFAF9] border border-[#F1EEE8] rounded-[16px] p-5">
              <div className="text-center">
                <div className="text-[11px] text-[#B3AC9F] uppercase tracking-wider font-semibold mb-1">From</div>
                <div className="font-mono text-[20px] font-bold text-[#18140F]">$5,000.00</div>
                <div className="text-[13px] text-[#4E4841] font-medium mt-1">USD</div>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <ArrowRight className="w-5 h-5 text-[#F1622C]" />
                <div className="text-[10px] text-[#B3AC9F] font-mono mt-1">0.9214</div>
              </div>

              <div className="text-center">
                <div className="text-[11px] text-[#B3AC9F] uppercase tracking-wider font-semibold mb-1">To</div>
                <div className="font-mono text-[20px] font-bold text-[#18140F]">€4,607.00</div>
                <div className="text-[13px] text-[#4E4841] font-medium mt-1">EUR</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FAFAF9] border border-[#F1EEE8] rounded-[12px] p-3">
                <div className="text-[10px] text-[#B3AC9F] uppercase tracking-wider font-semibold mb-1">Routing Rail</div>
                <div className="text-[13px] font-semibold text-[#18140F] flex items-center gap-1.5">
                  <BrainCircuit className="w-3 h-3 text-[#F1622C]" /> Internal FX
                </div>
              </div>
              <div className="bg-[#FAFAF9] border border-[#F1EEE8] rounded-[12px] p-3">
                <div className="text-[10px] text-[#B3AC9F] uppercase tracking-wider font-semibold mb-1">Reason</div>
                <div className="text-[13px] font-semibold text-[#18140F]">Payroll Hedge</div>
              </div>
            </div>

            <div className="bg-[#FDEBE0] border border-[#FDEBE0] rounded-[12px] p-4 flex items-start gap-3">
              <BrainCircuit className="w-4 h-4 text-[#F1622C] flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#4E4841] leading-relaxed">
                The AI locked in this rate because EUR/USD was favorable. This ensures your Friday payroll of €4,500 is fully covered without slippage.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <button 
              onClick={onClose}
              className="w-full bg-[#18140F] text-white py-3.5 rounded-[12px] text-[14px] font-semibold hover:bg-[#18140F]/90 transition-all"
            >
              Close Details
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}