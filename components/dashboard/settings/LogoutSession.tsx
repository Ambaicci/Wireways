"use client";
import { useState } from "react";
import { LogOut, Loader2, Globe } from "lucide-react";
import { logoutUser } from "@/lib/actions";

interface Props { email: string; }

export default function LogoutSession({ email }: Props) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await logoutUser();
    window.location.href = "/";
  };

  return (
    <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[10px] bg-[#F5EFE6]"><Globe className="w-4 h-4 text-[#6E5B3E]" /></div>
          <div>
            <h2 className="text-[14px] font-bold text-[#312B1E]">Signed in as {email}</h2>
            <p className="text-[11.5px] text-[#8D8476]">Leaving? The landing page will welcome you back anytime.</p>
          </div>
        </div>
        <button onClick={handleSignOut} disabled={signingOut}
          className="flex items-center gap-2 border border-[#E7C9BF] bg-[#F9ECE9] text-[#A84B3D] px-5 py-2.5 rounded-[12px] text-[13px] font-bold hover:bg-[#F5E5E0] transition-colors disabled:opacity-60">
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Log out
        </button>
      </div>
    </section>
  );
}