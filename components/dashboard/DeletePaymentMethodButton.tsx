"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deletePaymentMethod } from "@/lib/actions";

export default function DeletePaymentMethodButton({ id }: { id: number }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      await deletePaymentMethod(id);
      router.refresh();
    }
  };

  return (
    <button 
      onClick={handleDelete}
      className="text-muted-foreground hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}