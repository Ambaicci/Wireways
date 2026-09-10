import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import OpenWicClient from "@/components/dashboard/OpenWicClient";

export default async function OpenWICPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  // OpenWicClient handles its own API key fetching via the ApiKeys component
  return <OpenWicClient />;
}
// FORCE NEW DEPLOY COMMIT - 09/11/2026 00:41:39

// FORCE NEW DEPLOY COMMIT - 09/11/2026 00:42:38
