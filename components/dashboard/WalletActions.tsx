"use client";

import { useState } from "react";
import { Plus, ArrowLeftRight, ArrowUpRight, Trash2 } from "lucide-react";
import AddFundsModal from "./AddFundsModal";
import ConvertModal from "./ConvertModal";
import WithdrawModal from "./WithdrawModal";
import CloseWalletModal from "./CloseWalletModal";

interface WalletActionsProps {
  currency: string;
  balance: number;
}

export default function WalletActions({ currency, balance }: WalletActionsProps) {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCloseWalletOpen, setIsCloseWalletOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 mt-6">
      
      {/* Row 1: Add Funds & Withdraw */}
      <div className="flex gap-3">
        {/* Add Funds Button */}
        <button 
          onClick={() => setIsAddFundsOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0E1116] text-white py-3 rounded-[12px] text-[14px] font-semibold hover:bg-[#0E1116]/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Funds
        </button>

        {/* Withdraw Button */}
        <button 
          onClick={() => setIsWithdrawOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0E1116] border border-[#E4E6EB] py-3 rounded-[12px] text-[14px] font-semibold hover:border-[#0E1116] transition-all shadow-sm"
        >
          <ArrowUpRight className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Row 2: Convert */}
      <button 
        onClick={() => setIsConvertOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-white text-[#0E1116] border border-[#E4E6EB] py-3 rounded-[12px] text-[14px] font-semibold hover:border-[#0E1116] transition-all shadow-sm"
      >
        <ArrowLeftRight className="w-4 h-4" />
        Convert
      </button>

      {/* Row 3: Close Wallet */}
      <button 
        onClick={() => setIsCloseWalletOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-[12px] text-[14px] font-semibold hover:bg-red-100 transition-all shadow-sm"
      >
        <Trash2 className="w-4 h-4" />
        Close Wallet
      </button>

      {/* Modals */}
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

      {isWithdrawOpen && (
        <WithdrawModal 
          key="withdraw-modal"
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          currency={currency}
          availableBalance={balance}
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