"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Building2, Lock, Loader2, ArrowRight, PersonStanding, Briefcase, Eye, EyeOff, Check, X } from "lucide-react";
import { registerUser } from "@/lib/actions";
import { toast } from "@/components/ui/Toaster";
import AuthLayout from "@/components/auth/AuthLayout";

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[Math.min(score, 5)] };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [isLoading, setIsLoading] = useState(false);

  const strength = passwordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = name.trim() && email.trim() && password.length >= 8 && passwordsMatch && !isLoading;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    const res = await registerUser({
      name,
      email,
      company: accountType === "business" ? company : "",
      password,
      accountType,
    });
    setIsLoading(false);
    if (res.success) {
      toast(
        accountType === "personal"
          ? "Your personal account is ready. Welcome to Wireways."
          : "Workspace created successfully. Welcome to Wireways.",
        "success"
      );
      router.push("/dashboard");
    } else {
      toast(res.message || "Failed to create account", "error");
    }
  };

  // Static base class for all inputs; state variants are appended, never replaced.
  const inputBase =
    "w-full border rounded-xl pl-10 pr-11 py-3 text-[14px] tracking-[-0.01em] outline-none transition-all duration-200 bg-white placeholder:text-[#C9C3B8]";
  const inputCls =
    inputBase + " border-[#EAE6DF] focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10";
  const confirmCls =
    confirmPassword.length > 0
      ? passwordsMatch
        ? inputBase + " border-[#17824A] focus:border-[#17824A] focus:ring-4 focus:ring-[#17824A]/10"
        : inputBase + " border-[#E5484D] focus:border-[#E5484D] focus:ring-4 focus:ring-[#E5484D]/10"
      : inputBase + " border-[#EAE6DF] focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10";
  const labelCls = "text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-[0.12em]";

  return (
    <AuthLayout
      title={accountType === "personal" ? "Create your account" : "Create your workspace"}
      subtitle={accountType === "personal"
        ? "One ledger for your money — set up in under a minute."
        : "Your financial operating system — set up in under a minute."}
    >
      <form onSubmit={handleRegister} className="space-y-5">

        {/* Account type selector */}
        <div>
          <label className={labelCls}>Account Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAccountType("personal")}
              className={`group flex items-start gap-3 border rounded-2xl p-4 text-left transition-all duration-300 ${
                accountType === "personal"
                  ? "border-[#F1622C] bg-[#F1622C]/[0.04] shadow-[0_8px_24px_-8px_rgba(241,98,44,0.35)]"
                  : "border-[#EAE6DF] bg-white hover:border-[#D6D0C6] hover:shadow-sm"
              }`}
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors duration-300 ${accountType === "personal" ? "bg-[#F1622C] text-white" : "bg-[#F1EEE8] text-[#B3AC9F] group-hover:text-[#8C8579]"}`}>
                <PersonStanding className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-[13.5px] font-semibold text-[#18140F] tracking-[-0.01em]">Personal</span>
                <span className="block text-[11.5px] leading-snug text-[#8C8579] mt-1">For your own money, across currencies</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("business")}
              className={`group flex items-start gap-3 border rounded-2xl p-4 text-left transition-all duration-300 ${
                accountType === "business"
                  ? "border-[#F1622C] bg-[#F1622C]/[0.04] shadow-[0_8px_24px_-8px_rgba(241,98,44,0.35)]"
                  : "border-[#EAE6DF] bg-white hover:border-[#D6D0C6] hover:shadow-sm"
              }`}
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors duration-300 ${accountType === "business" ? "bg-[#F1622C] text-white" : "bg-[#F1EEE8] text-[#B3AC9F] group-hover:text-[#8C8579]"}`}>
                <Briefcase className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-[13.5px] font-semibold text-[#18140F] tracking-[-0.01em]">Business</span>
                <span className="block text-[11.5px] leading-snug text-[#8C8579] mt-1">Multi-currency operations at scale</span>
              </span>
            </button>
          </div>
        </div>

        {/* Full name */}
        <div>
          <label className={labelCls}>Full Name</label>
          <div className="mt-2 relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className={inputCls}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>{accountType === "business" ? "Work Email" : "Email"}</label>
          <div className="mt-2 relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={accountType === "business" ? "you@company.com" : "you@example.com"}
              className={inputCls}
            />
          </div>
        </div>

        {/* Company (business only) */}
        {accountType === "business" && (
          <div>
            <label className={labelCls}>Company Name <span className="normal-case tracking-normal text-[#B3AC9F]">(optional)</span></label>
            <div className="mt-2 relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
              <input
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Password — eye always works */}
        <div>
          <label className={labelCls}>Password</label>
          <div className="mt-2 relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
            <input
              type={showPw ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              title={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#B3AC9F] hover:text-[#4E4841] transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                    strength.score >= i
                      ? strength.score <= 2 ? "bg-[#E5484D]" : strength.score === 3 ? "bg-[#9C6B08]" : "bg-[#17824A]"
                      : "bg-[#EAE6DF]"
                  }`} />
                ))}
              </div>
              <span className={`text-[10.5px] font-medium tracking-wide w-16 text-right ${strength.score <= 2 ? "text-[#E5484D]" : strength.score === 3 ? "text-[#9C6B08]" : "text-[#17824A]"}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password — always masked, checkmark verifies */}
        <div>
          <label className={labelCls}>Confirm Password</label>
          <div className="mt-2 relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={confirmCls}
            />
            {confirmPassword.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                {passwordsMatch
                  ? <Check className="w-4 h-4 text-[#17824A]" />
                  : <X className="w-4 h-4 text-[#E5484D]" />}
              </span>
            )}
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-[11.5px] text-[#E5484D]">Passwords don't match yet.</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-[#F1622C] text-white py-3.5 rounded-xl text-[14px] font-semibold tracking-[-0.01em] hover:bg-[#C94A1D] hover:shadow-lg hover:shadow-[#F1622C]/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-[#F1622C]/20 flex items-center justify-center gap-2 mt-7"
        >
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <>{accountType === "personal" ? "Create Account" : "Create Workspace"} <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="relative py-1.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAE6DF]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#F6F5F3] px-3 text-[10.5px] text-[#B3AC9F] uppercase tracking-[0.12em]">Already have an account?</span>
          </div>
        </div>

        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 border border-[#4C5C88]/25 text-[#4C5C88] py-3.5 rounded-xl text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-[#4C5C88]/5 hover:border-[#4C5C88]/40 active:scale-[0.99] transition-all duration-200"
        >
          Sign in instead
        </Link>
      </form>
    </AuthLayout>
  );
}
