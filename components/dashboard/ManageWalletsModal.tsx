"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { toggleWalletVisibility } from "@/lib/actions";
import { toast } from "@/components/ui/Toaster";

const flags: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", USDC: "💲", KES: "🇰🇪"
};

const walletNames: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  USDC: "USD Coin",
  KES: "Kenyan Shilling",
};

export default function ManageWalletsModal({ 
  wallets, 
  onClose 
}: { 
  wallets: { currency: string; is_active: number }[]; 
  onClose: () => void;
}) {
  const router = useRouter();
  const [localWallets, setLocalWallets] = useState(wallets);

  const handleToggle = async (currency: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Optimistic UI update
    setLocalWallets(prev => prev.map(w => 
      w.currency === currency ? { ...w, is_active: newStatus } : w
    ));

    const res = await toggleWalletVisibility({ currency, isActive: newStatus === 1 });
    if (!res.success) {
      toast(res.message, "error");
      setLocalWallets(wallets); // Revert on failure
    } else {
      router.refresh();
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-[#18140F]/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-t-3xl md:rounded-3xl p-8 w-full md:max-w-md shadow-2xl border border-[#EAE6DF]"
        initial={{ y: "100%", scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[20px] font-semibold text-[#18140F] tracking-tight">Manage Wallets</h3>
            <p className="text-[13px] text-[#8C8579] mt-1">Choose which currencies appear on your dashboard.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C8579] hover:bg-[#F6F5F3] hover:text-[#18140F] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {localWallets.map((wallet) => (
            <div key={wallet.currency} className="flex items-center justify-between p-4 bg-[#FAFAF9] rounded-2xl border border-[#EAE6DF] hover:border-[#F1622C]/30 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-[22px] leading-none">{flags[wallet.currency] || "🌍"}</span>
                <div>
                  <span className="font-semibold text-[#18140F] text-[14px]">{walletNames[wallet.currency] || wallet.currency}</span>
                  <span className="text-[#8C8579] text-[12px] font-mono ml-2">{wallet.currency}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle(wallet.currency, wallet.is_active)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${wallet.is_active === 1 ? 'bg-[#17824A] shadow-sm shadow-[#17824A]/20' : 'bg-[#EAE6DF]'}`}
              >
                <span 
                  className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-300 ${wallet.is_active === 1 ? 'translate-x-6' : 'translate-x-1'}`}
                >
                  {wallet.is_active === 1 && <Check className="w-3 h-3 text-[#17824A]" />}
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#EAE6DF]">
           <p className="text-[11px] text-[#B3AC9F] text-center">
             More global currencies are coming soon to Wireways.
           </p>
        </div>
      </motion.div>
    </motion.div>
  );
}