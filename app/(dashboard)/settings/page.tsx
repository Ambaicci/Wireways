import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsView from "@/components/dashboard/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const result = await db.execute(
    "SELECT name, email, company, account_type FROM users WHERE id = $1",
    [session.userId]
  );
  const row = result.rows[0] as any;

  return (
    <SettingsView
      user={{
        name: (row?.name as string) || "",
        email: (row?.email as string) || "",
        company: (row?.company as string) || "",
        accountType: (row?.account_type as string) || "personal",
      }}
    />
  );
}