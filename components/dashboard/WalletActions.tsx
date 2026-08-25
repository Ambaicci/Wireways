"use client";

import { useState } from "react";
import { Plus, ArrowLeftRight, Trash2 } from "lucide-react";
import AddFundsModal from "./AddFundsModal";
import ConvertModal from "./ConvertModal";
import CloseWalletModal from "./CloseWalletModal";

interface WalletActionsProps {
  currency: string;
  balance: number;
}

export default function WalletActions({ currency, balance }: WalletActionsProps) {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isCloseWalletOpen, setIsCloseWalletOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 mt-6">
      <div className="flex gap-3">
        {/* Add Funds Button */}
        <button 
          onClick={() => setIsAddFundsOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0E1116] text-white py-3 rounded-[12px] text-[14px] font-semibold hover:bg-[#0E1116]/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Funds
        </button>

        {/* Convert Button */}
        <button 
          onClick={() => setIsConvertOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0E1116] border border-[#E4E6EB] py-3 rounded-[12px] text-[14px] font-semibold hover:border-[#0E1116] transition-all shadow-sm"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Convert
        </button>
      </div>

      {/* Close Wallet Button */}
      <button 
        onClick={() => setIsCloseWalletOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-[12px] text-[14px] font-semibold hover:bg-red-100 transition-all shadow-sm"
      >
        <Trash2 className="w-4 h-4" />
        Close Wallet
      </button>

      {/* Modals with Unique Keys to fix the error */}
      {isAddFundsOpen && (
        <AddFundsModal 
          key="add-funds-modal"
          currency={currency} 
          isOpen={isAddFundsOpen} 
          onClose={() => setIsAddFundsOpen(false)} 
        />
      )}
      
      {isConvertOpen && (
        <ConvertModal 
          key="convert-modal"
          isOpen={isConvertOpen} 
          onClose={() => setIsConvertOpen(false)} 
        />
      )}

      {isCloseWalletOpen && (
        <CloseWalletModal 
          key="close-wallet-modal"
          currency={currency} 
          balance={balance}
          isOpen={isCloseWalletOpen} 
          onClose={() => setIsCloseWalletOpen(false)} 
        />
      )}
    </div>
  );
}