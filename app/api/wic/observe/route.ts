import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { observeWorld } from "@/wic/observe";

// Diagnostic endpoint: reveals WIC's raw world model for the signed-in user.
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const world = await observeWorld(session.userId);
    return NextResponse.json({ success: true, world });
  } catch (error: any) {
    console.error("WIC Observer Error:", error);
    return NextResponse.json({ success: false, message: "Observer failed." }, { status: 500 });
  }
}