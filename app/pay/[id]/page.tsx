import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PaymentCheckout from "@/components/public/PaymentCheckout";
import { Unlink, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

// Ensure this route is always rendered dynamically, never statically cached
export const dynamic = 'force-dynamic';

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+ requires awaiting params
  const { id } = await params;
  const linkId = parseInt(id, 10);
  
  if (isNaN(linkId) || linkId <= 0) {
    notFound();
  }

  try {
    // CRITICAL UPGRADE: Join with users table to get merchant info for trust
    const result = await db.execute(
      `SELECT pl.id, pl.amount, pl.currency, pl.status, pl.description, 
              u.name as merchant_name, u.company as merchant_company 
       FROM payment_links pl
       JOIN users u ON pl.user_id = u.id
       WHERE pl.id = $1`, 
      [linkId]
    );

    // Clean "Link not found" state
    if (result.rows.length === 0) {
      return (
        <main className="min-h-screen bg-[#F6F5F3] flex items-center justify-center p-6">
          <div className="text-center bg-white border border-[#EAE6DF] rounded-3xl p-10 shadow-xl max-w-[420px] w-full">
            <div className="w-16 h-16 mx-auto bg-[#FBF1DA] rounded-full flex items-center justify-center mb-5">
              <Unlink className="w-8 h-8 text-[#9C6B08]" />
            </div>
            <h1 className="text-xl font-semibold text-[#18140F] tracking-tight">Link not found</h1>
            <p className="text-sm text-[#8C8579] mt-2">This payment link does not exist or has been removed by the merchant.</p>
          </div>
        </main>
      );
    }

    const row = result.rows[0] as any;

    // CRITICAL: Convert the database row into a fresh, plain serializable object
    const link = {
      id: Number(row.id),
      amount: Number(row.amount),
      currency: String(row.currency).toUpperCase(),
      status: String(row.status),
      description: row.description ? String(row.description) : "Payment Request",
      merchantName: row.merchant_name || "Merchant",
      merchantCompany: row.merchant_company || null,
    };

    // 🛡️ SERVER-SIDE SAFEGUARD: Already Paid
    if (link.status === "Paid") {
      return (
        <main className="min-h-screen bg-[#F6F5F3] flex items-center justify-center p-6">
          <div className="text-center bg-white border border-[#EAE6DF] rounded-3xl p-10 shadow-xl max-w-[420px] w-full">
            <div className="w-16 h-16 mx-auto bg-[#E7F2EC] rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-8 h-8 text-[#287A55]" />
            </div>
            <h1 className="text-xl font-semibold text-[#18140F] tracking-tight">Payment Successful</h1>
            <p className="text-sm text-[#8C8579] mt-2">
              This payment of {formatCurrency(link.amount, link.currency)} has already been completed.
            </p>
          </div>
        </main>
      );
    }

    // 🛡️ SERVER-SIDE SAFEGUARD: Inactive/Cancelled
    if (link.status !== "Active") {
      return (
        <main className="min-h-screen bg-[#F6F5F3] flex items-center justify-center p-6">
          <div className="text-center bg-white border border-[#EAE6DF] rounded-3xl p-10 shadow-xl max-w-[420px] w-full">
            <div className="w-16 h-16 mx-auto bg-[#FBF1DA] rounded-full flex items-center justify-center mb-5">
              <Unlink className="w-8 h-8 text-[#9C6B08]" />
            </div>
            <h1 className="text-xl font-semibold text-[#18140F] tracking-tight">Link Inactive</h1>
            <p className="text-sm text-[#8C8579] mt-2">This payment link is no longer active or has expired.</p>
          </div>
        </main>
      );
    }

    // Only render the interactive checkout if the link is truly Active
    return <PaymentCheckout link={link} />;
    
  } catch (error) {
    console.error("Failed to fetch payment link:", error);
    notFound();
  }
}