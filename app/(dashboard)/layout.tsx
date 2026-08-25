import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AiCommandBar from "@/components/dashboard/AiCommandBar";
import MobileNav from "@/components/dashboard/MobileNav";
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
  // GHOST BUSTER: Must be outside the try/catch
  const session = await verifySession();
  if (!session) redirect("/login");

  let label = "Wireways";
  let initials = "W";

  try {
    const result = await db.execute("SELECT name, email FROM users WHERE id = ?", [session.userId]);
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

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen w-full bg-[#F6F5F3]">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        {/* Mobile top bar + bottom tabs */}
        <MobileNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header (desktop only) */}
          <header className="hidden md:flex sticky top-0 z-40 items-center justify-end gap-3.5 px-8 py-4 bg-[#F6F5F3]/85 backdrop-blur-md border-b border-[#F1EEE8]">
            <div className="flex items-center gap-2 border border-[#EAE6DF] bg-white px-3 py-1.5 rounded-[10px] cursor-pointer hover:border-[#8C8579] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#B3AC9F]">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className="text-[13px] text-[#B3AC9F] font-medium">Ask Wireways</span>
              <kbd className="font-mono text-[11px] bg-[#FAFAF9] border border-[#EAE6DF] rounded px-1 py-0.5 text-[#8C8579]">⌘K</kbd>
            </div>

            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F1622C] to-[#FF9A6B] flex items-center justify-center text-white text-[12px] font-semibold shadow-sm"
              title={label}
            >
              {initials}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-20 md:pt-8 pb-56 md:pb-40 bg-[#F6F5F3]">
            {children}
          </main>
        </div>

        {/* Floating AI Dock */}
        <AiCommandBar />
      </div>
    </ErrorBoundary>
  );
}