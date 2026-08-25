"use client";
import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface Props {
  patchSetting: (key: string, value: any) => void;
}

export default function DangerZone({ patchSetting }: Props) {
  const [forgetting, setForgetting] = useState(false);
  const [forgetConfirm, setForgetConfirm] = useState(false);

  const handleForgetMemory = async () => {
    setForgetting(true);
    await patchSetting("wic_memory_on", 0);
    setForgetting(false);
    setForgetConfirm(false);
  };

  return (
    <section className="bg-[#FFFDF9] border border-[#E7C9BF] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-[10px] bg-[#F9ECE9]"><AlertTriangle className="w-4 h-4 text-[#A84B3D]" /></div>
        <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">Danger zone</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4">
          <div>
            <div className="text-[13px] font-bold text-[#312B1E]">Forget what WIC learned</div>
            <p className="text-[11.5px] text-[#8D8476] mt-0.5 leading-relaxed">Clear WIC's memory of your cadences and counterparties. WIC will start learning fresh from your next transactions.</p>
          </div>
          {forgetConfirm ? (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setForgetConfirm(false)} className="px-3 py-2 rounded-[9px] border border-[#E8E0D4] text-[11px] font-bold text-[#6E665A]">Cancel</button>
              <button onClick={handleForgetMemory} disabled={forgetting}
                className="px-3 py-2 rounded-[9px] bg-[#A84B3D] text-white text-[11px] font-bold disabled:opacity-60 flex items-center gap-1.5">
                {forgetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Confirm
              </button>
            </div>
          ) : (
            <button onClick={() => setForgetConfirm(true)}
              className="shrink-0 border border-[#E7C9BF] bg-[#F9ECE9] text-[#A84B3D] px-3 py-2 rounded-[9px] text-[11px] font-bold hover:bg-[#F5E5E0] transition-colors">
              Forget
            </button>
          )}
        </div>

        <div className="rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4 opacity-60">
          <div className="text-[13px] font-bold text-[#312B1E]">Delete account <span className="ml-2 text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F5EFE6] text-[#8D8476] px-1.5 py-0.5 rounded-full">Coming soon</span></div>
          <p className="text-[11.5px] text-[#8D8476] mt-0.5 leading-relaxed">Permanently remove your account and all data. Requires confirmation by email.</p>
        </div>
      </div>
    </section>
  );
}