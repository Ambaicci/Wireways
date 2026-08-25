"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreateLinkModal from "./CreateLinkModal";
import { AnimatePresence } from "framer-motion";

export default function CreateLinkButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-b from-[#F97C4B] to-[#EE5A1F] text-white px-4 py-2.5 rounded-xl text-[13.5px] font-semibold shadow-lg shadow-[#F1622C]/25 hover:brightness-105 transition-all"
      >
        <Plus className="w-4 h-4" /> Create Link
      </button>
      
      <AnimatePresence>
        {isOpen && <CreateLinkModal onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}