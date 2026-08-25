import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { observeWorld } from "@/wic/observe";
import { recallMemory } from "@/wic/memory";

// Diagnostic endpoint: reveals what WIC has learned about you.
export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const world = await observeWorld(session.userId);
    const memory = recallMemory(world);
    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    console.error("WIC Memory Error:", error);
    return NextResponse.json({ success: false, message: "Memory failed." }, { status: 500 });
  }
}