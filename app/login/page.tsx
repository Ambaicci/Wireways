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
      toast("Signed in successfully. Welcome to Wireways.", "success");
      router.push("/dashboard");
    } else {
      toast(res.message, "error");
    }
  };

  return (
    <AuthLayout
      title={returning ? "Welcome back" : "Welcome to Wireways"}
      subtitle={
        returning
          ? "Sign in to your workspace."
          : "Sign in to your workspace — or create one in under a minute."
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Email address</label>
          <div className="mt-1.5 relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full border border-[#EAE6DF] rounded-xl pl-10 pr-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Password</label>
          <div className="mt-1.5 relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F]" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full border border-[#EAE6DF] rounded-xl pl-10 pr-11 py-3 text-[14px] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#B3AC9F] hover:text-[#4E4841] transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F1622C] text-white py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#C94A1D] transition-all disabled:opacity-60 shadow-lg shadow-[#F1622C]/25 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAE6DF]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#F6F5F3] px-3 text-[11px] text-[#B3AC9F] uppercase tracking-wider">New to Wireways?</span>
          </div>
        </div>

        <Link
          href="/register"
          className="w-full flex items-center justify-center gap-2 border border-[#4C5C88]/30 text-[#4C5C88] py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#4C5C88]/5 transition-all"
        >
          Create a workspace
        </Link>
      </form>
    </AuthLayout>
  );
}