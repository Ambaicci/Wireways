import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PaymentCheckout from "@/components/public/PaymentCheckout";
import { Unlink } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const linkId = parseInt(id, 10);
  if (isNaN(linkId)) notFound();

  const result = await db.execute("SELECT id, amount, currency, status, description FROM payment_links WHERE id = ?", [linkId]);

  // Clean "Link not found" state
  if (result.rows.length === 0) {
    return (
      <main className="min-h-screen bg-[#F6F5F3] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto bg-white border border-[#EAE6DF] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Unlink className="w-6 h-6 text-[#B3AC9F]" />
          </div>
          <h1 className="text-xl font-semibold text-[#18140F] tracking-tight">Link not found</h1>
          <p className="text-sm text-[#8C8579] mt-2">This payment link does not exist or has been removed.</p>
        </div>
      </main>
    );
  }

  const row = result.rows[0];

  // FIX: Convert the database row into a fresh, plain serializable object
  // so it can be safely passed to the Client Component.
  const link = {
    id: Number(row.id),
    amount: Number(row.amount),
    currency: String(row.currency),
    status: String(row.status),
    description: String(row.description),
  };

  return <PaymentCheckout link={link} />;
}