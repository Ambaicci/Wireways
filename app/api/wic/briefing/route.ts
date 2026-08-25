import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { observeWorld } from "@/wic/observe";
import { buildBriefing } from "@/wic/intelligence";
import { db } from "@/lib/db";

// WIC Briefing endpoint: observe the world, then reason over it.
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // 1. Get the real name from the database
    const userRes = await db.execute("SELECT name FROM users WHERE id = ?", [session.userId]);
    const firstName = userRes.rows[0]?.name 
      ? String(userRes.rows[0].name).split(" ")[0] 
      : undefined;

    // 2. Observe and Build
    const world = await observeWorld(session.userId);
    const briefing = buildBriefing(world, firstName);
    
    return NextResponse.json({ success: true, briefing });
  } catch (error: any) {
    console.error("WIC Briefing Error:", error);
    return NextResponse.json({ success: false, message: "Briefing failed." }, { status: 500 });
  }
}