"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginUser } from "@/lib/actions";
import { toast } from "@/components/ui/Toaster";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [returning, setReturning] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Smart welcome: recognize this device
  useEffect(() => {
    setReturning(localStorage.getItem("ww_device") === "known");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await loginUser({ email, password });
    setIsLoading(false);
    if (res.success) {
      localStorage.setItem("ww_device", "known");
      toast(returning ? "Welcome back." : "Signed in successfully. Welcome to Wireways.", "success");
      router.push("/dashboard");
    } else {
      // Gentle shake + clear password: honest feedback, no silent dead-end.
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 500);
      toast(res.message || "Sign in failed", "error");
    }
  };

  const inputCls = "w-full border border-[#EAE6DF] rounded-xl pl-10 pr-11 py-3 text-[14px] tracking-[-0.01em] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all duration-200 bg-white placeholder:text-[#C9C3B8]";
  const labelCls = "text-[10.5px] font-semibold text-[#8C8579] uppercase tracking-[0.12em]";

  return (
    <AuthLayout
      title={returning ? "Welcome back" : "Welcome to Wireways"}
      subtitle={
        returning
          ? "Good to see you again. Sign in to continue."
          : "Sign in to your workspace — or create one in under a minute."
      }
    >
      <style>{`
        @keyframes ww-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .ww-shake { animation: ww-shake 0.45s ease-in-out; }
      `}</style>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className={labelCls}>Email address</label>
          <div className="mt-2 relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={returning ? "Your usual address" : "you@company.com"}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Password</label>
          <div className={`mt-2 relative ${shake ? "ww-shake" : ""}`}>
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F] pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={`${inputCls} !pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#B3AC9F] hover:text-[#4E4841] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Subtle helper after a failed attempt */}
          {shake && (
            <p className="mt-1.5 text-[11.5px] text-[#E5484D]">That didn't match. Check your details and try again.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F1622C] text-white py-3.5 rounded-xl text-[14px] font-semibold tracking-[-0.01em] hover:bg-[#C94A1D] hover:shadow-lg hover:shadow-[#F1622C]/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-[#F1622C]/20 flex items-center justify-center gap-2 mt-7"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="relative py-1.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAE6DF]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#F6F5F3] px-3 text-[10.5px] text-[#B3AC9F] uppercase tracking-[0.12em]">New to Wireways?</span>
          </div>
        </div>

        <Link
          href="/register"
          className="w-full flex items-center justify-center gap-2 border border-[#4C5C88]/25 text-[#4C5C88] py-3.5 rounded-xl text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-[#4C5C88]/5 hover:border-[#4C5C88]/40 active:scale-[0.99] transition-all duration-200"
        >
          Create an account
        </Link>
      </form>
    </AuthLayout>
  );
}
