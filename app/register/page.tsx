"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Building2, Lock, Loader2, ArrowRight } from "lucide-react";
import { registerUser } from "@/lib/actions";
import { toast } from "@/components/ui/Toaster";
import AuthLayout from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await registerUser({ 
      name, 
      email, 
      company, 
      password, 
      accountType: "business" 
    });
    setIsLoading(false);
    if (res.success) {
      toast("Workspace created successfully. Welcome to Wireways.", "success");
      router.push("/dashboard");
    } else {
      toast(res.message || "Failed to create account", "error");
    }
  };

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Set up your financial operating system in under a minute."
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Full Name</label>
          <div className="mt-1.5 relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F]" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full border border-[#EAE6DF] rounded-xl pl-10 pr-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Work Email</label>
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
          <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Company Name (Optional)</label>
          <div className="mt-1.5 relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F]" />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              className="w-full border border-[#EAE6DF] rounded-xl pl-10 pr-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#8C8579] uppercase tracking-wider">Password</label>
          <div className="mt-1.5 relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3AC9F]" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full border border-[#EAE6DF] rounded-xl pl-10 pr-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C] focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F1622C] text-white py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#C94A1D] transition-all disabled:opacity-60 shadow-lg shadow-[#F1622C]/25 flex items-center justify-center gap-2 mt-6"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Workspace <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAE6DF]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#F6F5F3] px-3 text-[11px] text-[#B3AC9F] uppercase tracking-wider">Already have an account?</span>
          </div>
        </div>

        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 border border-[#4C5C88]/30 text-[#4C5C88] py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#4C5C88]/5 transition-all"
        >
          Sign in instead
        </Link>
      </form>
    </AuthLayout>
  );
}