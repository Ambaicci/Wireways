import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

async function ensureColumns() {
  const cols = [
    "single_use INTEGER DEFAULT 0",
    "purpose TEXT",
    "monthly_limit REAL",
    "currency TEXT",
  ];
  for (const c of cols) {
    try { await db.execute(`ALTER TABLE payment_methods ADD COLUMN ${c}`); } catch {}
  }
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  await ensureColumns();

  const b = await req.json();
  const { id, name, type, details, single_use, purpose, monthly_limit, currency } = b;
  try {
    if (id) {
      await db.execute(
        "UPDATE payment_methods SET name=?, type=?, details=?, single_use=?, purpose=?, monthly_limit=?, currency=? WHERE id=? AND user_id=?",
        [name, type, details, single_use ? 1 : 0, purpose || null, monthly_limit || null, currency || null, id, session.userId]
      );
    } else {
      await db.execute(
        "INSERT INTO payment_methods (user_id, type, name, details, single_use, purpose, monthly_limit, currency) VALUES (?,?,?,?,?,?,?,?)",
        [session.userId, type, name, details, single_use ? 1 : 0, purpose || null, monthly_limit || null, currency || null]
      );
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  await db.execute("DELETE FROM payment_methods WHERE id=? AND user_id=?", [Number(id), session.userId]);
  return NextResponse.json({ success: true });
}