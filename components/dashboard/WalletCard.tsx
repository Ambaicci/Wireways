"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Copy } from "lucide-react";
import DepositModal from "./DepositModal";
import ConvertModal from "./ConvertModal";

// Helper to format the currency symbols properly
const formatBalance = (currency: string, balance: number) => {
  switch (currency) {
    case 'USD': return `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR': return `€${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'GBP': return `£${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'USDC': return `${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
    default: return balance.toLocaleString();
  }
};

export default function WalletCard({ 
  wallet, 
  theme, 
  flag 
}: { 
  wallet: { id: number; currency: string; balance: number; bank: string; details: string };
  theme: string;
  flag: string;
}) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Bypass TypeScript checking for the temporary DepositModal stub
  const depositModalProps: any = {
    currency: wallet.currency,
    flag,
    onClose: () => setIsDepositModalOpen(false)
  };

  return (
    <>
      <div className={`${theme} border rounded-2xl p-6 shadow-sm flex flex-col transition-all hover:shadow-md`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{flag}</span>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {wallet.currency} Wallet
              </h3>
              <p className="text-xs text-neutral-500">
                {wallet.bank}
              </p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {formatBalance(wallet.currency, wallet.balance)}
          </h2>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-white rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Local Account Details</p>
            <p className="text-sm font-mono text-neutral-700">
              {wallet.details}
            </p>
          </div>
          <button className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3 mt-auto">
          <button 
            onClick={() => setIsConvertModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Convert
          </button>
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium border border-neutral-200 bg-white/50 text-neutral-700 px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Add Funds
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDepositModalOpen && (
          <DepositModal {...depositModalProps} />
        )}
                {isConvertModalOpen && (
          <ConvertModal 
            {...{
              currency: wallet.currency,
              flag,
              onClose: () => setIsConvertModalOpen(false)
            } as any}
          />
        )}
      </AnimatePresence>
    </>
  );
}