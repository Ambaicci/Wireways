"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import CopyLinkButton from "./CopyLinkButton";

interface PaymentLink {
  id: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

export default function PaymentLinksList({ initialLinks }: { initialLinks: PaymentLink[] }) {
  const [links, setLinks] = useState(initialLinks);
  const router = useRouter();

  useEffect(() => {
    const handleRefresh = () => {
      router.refresh();
    };
    window.addEventListener("refresh-payment-links", handleRefresh);
    return () => window.removeEventListener("refresh-payment-links", handleRefresh);
  }, [router]);

  if (links.length === 0) {
    return (
      <div className="text-center bg-white border border-[#EAE6DF] rounded-[16px] p-12 shadow-sm">
        <div className="w-16 h-16 mx-auto bg-[#EAEDF3] rounded-full flex items-center justify-center mb-5">
          <Link2 className="w-8 h-8 text-[#4C5C88]" />
        </div>
        <h2 className="text-[17px] font-semibold text-[#312B1E] tracking-tight">No payment links yet</h2>
        <p className="text-[13px] text-[#8D8476] mt-2 max-w-[340px] mx-auto">
          Create your first payment link to start collecting money from anyone, anywhere.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-[16px] overflow-hidden shadow-sm">
      {links.map((link, i) => (
        <div 
          key={link.id} 
          className={`p-5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors group ${i > 0 ? "border-t border-[#F5F5F4]" : ""}`}
        >
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#EAEDF3] flex items-center justify-center flex-shrink-0">
              <Link2 className="w-5 h-5 text-[#4C5C88]" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-[14px] font-[600] text-[#312B1E] truncate">{link.description}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                  link.status === "Active" ? "bg-[#E7F2EC] text-[#287A55]" :
                  link.status === "Paid" ? "bg-[#EAEDF3] text-[#4C5C88]" :
                  "bg-[#F5F5F4] text-[#A8A29E]"
                }`}>
                  {link.status}
                </span>
              </div>
              <p className="text-[12px] text-[#8D8476] mt-0.5 flex items-center gap-2">
                <span className="font-mono text-[11px] bg-[#F6F5F3] px-1.5 py-0.5 rounded">
                  lnk_{String(link.id).padStart(6, '0')}
                </span>
                <span>·</span>
                <span>{new Date(link.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-[14px] font-[700] text-[#312B1E] tabular-nums">
                {formatCurrency(link.amount, link.currency)}
              </p>
            </div>
            <CopyLinkButton linkId={link.id} />
          </div>
        </div>
      ))}
    </div>
  );
}