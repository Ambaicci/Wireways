"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings2 } from "lucide-react";
import ManageWalletsModal from "./ManageWalletsModal";

export default function ManageWalletsButton({ 
  wallets 
}: { 
  wallets: { currency: string; is_active: number }[] 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 text-[13.5px] font-semibold text-[#4E4841] bg-white border border-[#EAE6DF] px-4 py-2.5 rounded-xl hover:border-[#F1622C]/40 hover:text-[#F1622C] hover:shadow-sm transition-all"
      >
        <Settings2 className="w-4 h-4" />
        Manage Wallets
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <ManageWalletsModal 
            wallets={wallets} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}