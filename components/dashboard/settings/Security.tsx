"use client";
import { useState } from "react";
import { Eye, EyeOff, Check, Loader2, ShieldCheck, Lock, Smartphone } from "lucide-react";
import { changePassword } from "@/lib/actions";

const inputCls = "mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]";
const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const checks = [
    { label: "8+ characters", ok: newPassword.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(newPassword) },
    { label: "Lowercase", ok: /[a-z]/.test(newPassword) },
    { label: "Number", ok: /\d/.test(newPassword) },
  ];
  const passwordReady = checks.every((c) => c.ok) && newPassword === confirmPassword && currentPassword.length > 0;

  const handleChangePassword = async () => {
    setSavingPassword(true);
    const res = await changePassword({ currentPassword, newPassword });
    setSavingPassword(false);
    if (res.success) { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
  };

  return (
    <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-[10px] bg-[#E8F3EC]"><ShieldCheck className="w-4 h-4 text-[#287A55]" /></div>
        <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">Security</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>New password</label>
            <div className="mt-1.5 relative">
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-[#E8E0D4] rounded-[12px] px-3.5 pr-10 py-3 text-[14px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#B3AC9F] hover:text-[#312B1E]">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type={showNew ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={`mt-1.5 w-full border rounded-[12px] px-3.5 py-3 text-[14px] outline-none focus:ring-4 transition-all bg-white ${
                confirmPassword.length > 0 ? confirmPassword === newPassword ? "border-[#287A55] focus:ring-[#287A55]/10" : "border-[#A84B3D] focus:ring-[#A84B3D]/10" : "border-[#E8E0D4] focus:ring-[#F1622C]/10"
              }`} />
          </div>
        </div>

        {newPassword.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${c.ok ? "bg-[#287A55]" : "bg-[#E8E0D4]"}`}>
                  {c.ok && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-[11px] ${c.ok ? "text-[#287A55]" : "text-[#8D8476]"}`}>{c.label}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleChangePassword} disabled={!passwordReady || savingPassword}
          className="flex items-center gap-2 bg-[#312B1E] text-white px-5 py-2.5 rounded-[12px] text-[13px] font-bold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Update password
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-start gap-3 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4 opacity-70">
            <div className="p-2 rounded-[10px] bg-[#F5EFE6]"><Lock className="w-4 h-4 text-[#6E5B3E]" /></div>
            <div>
              <div className="text-[13px] font-bold text-[#312B1E]">Two-factor authentication <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F5EFE6] text-[#8D8476] px-1.5 py-0.5 rounded-full">Coming soon</span></div>
              <p className="text-[11px] text-[#8D8476] mt-0.5">An extra lock on the door, on your phone.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4 opacity-70">
            <div className="p-2 rounded-[10px] bg-[#F5EFE6]"><Smartphone className="w-4 h-4 text-[#6E5B3E]" /></div>
            <div>
              <div className="text-[13px] font-bold text-[#312B1E]">Active sessions <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F5EFE6] text-[#8D8476] px-1.5 py-0.5 rounded-full">Coming soon</span></div>
              <p className="text-[11px] text-[#8D8476] mt-0.5">See and revoke devices signed into your workspace.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}