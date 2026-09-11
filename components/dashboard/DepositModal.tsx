"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";

export interface Props {
  currency: string;
  flag: string;
  onClose: () => void;
}

export default function DepositModal({ currency, flag, onClose }: Props) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-[24px] w-full max-w-[420px] p-6 shadow-2xl border border-neutral-100"
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[17px] font-bold flex items-center gap-2 text-neutral-900">
            <span className="text-xl">{flag}</span> Add Funds ({currency})
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Secure deposit methods for your {currency} wallet are being finalized. Check back soon!
        </p>
        <button 
          onClick={onClose} 
          className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}