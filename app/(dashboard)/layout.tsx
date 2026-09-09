import DashboardShell from "@/components/layout/DashboardShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");

  let label = "Wireways";
  let initials = "W";

  try {
    const result = await db.execute(
      "SELECT name, email FROM users WHERE id = $1",
      [session.userId]
    );
    const row = result.rows[0] as any;
    label = (row?.name as string) || (row?.email as string) || "Wireways";
    initials = label
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  } catch (error) {
    console.error("Failed to load user profile for layout:", error);
  }

  // Fetch user wallets for the manual modals
  let wallets: { currency: string; balance: number }[] = [];
  try {
    const wRes = await db.execute(
      "SELECT currency, balance FROM wallets WHERE user_id = $1",
      [session.userId]
    );
    wallets = wRes.rows as any[];
  } catch (error) {
    console.error("Failed to load wallets for layout:", error);
  }

  // Fetch real users for internal payment links (excluding current user)
  let contacts: { id: string; name: string; email: string }[] = [];
  try {
    const cRes = await db.execute(
      "SELECT id, name, email FROM users WHERE id != $1 ORDER BY name ASC",
      [session.userId]
    );
    contacts = cRes.rows as any[];
  } catch (error) {
    console.error("Failed to load contacts for layout:", error);
  }

   // Fetch Virtual Account details (if provisioned)
  // TODO: Update column names once the schema is finalized
  let virtualAccount: { number: string; bank: string } | null = null;
  /* 
  try {
    const vRes = await db.execute(
      "SELECT virtual_account_number, bank_name FROM users WHERE id = $1",
      [session.userId]
    );
    if (vRes.rows.length > 0 && vRes.rows[0].virtual_account_number) {
      virtualAccount = {
        number: vRes.rows[0].virtual_account_number as string,
        bank: (vRes.rows[0].bank_name as string) || "Wireways Partner Bank",
      };
    }
  } catch (error) {
    // Silently fail until schema is ready
  }
  */

  return (
    <ErrorBoundary>
      <DashboardShell 
        label={label} 
        initials={initials} 
        wallets={wallets}
        contacts={contacts}
        virtualAccount={virtualAccount}
      >
        {children}
      </DashboardShell>
    </ErrorBoundary>
  );
}