import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenWicClient from "@/components/dashboard/OpenWicClient";

export default async function OpenWICPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  // Fetch the user's actual publishable key to inject into the code snippet
  let publishableKey: string | null = null;
  try {
    const keyRes = await db.execute(
      "SELECT publishable_key FROM api_keys WHERE user_id = $1",
      [session.userId]
    );
    if (keyRes.rows.length > 0) {
      publishableKey = keyRes.rows[0].publishable_key as string;
    }
  } catch (error) {
    console.error("Failed to fetch API keys for OpenWIC:", error);
  }

  return <OpenWicClient publishableKey={publishableKey} />;
}