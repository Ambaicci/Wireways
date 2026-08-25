import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { randomUUID } from "crypto";
import { wicProcess, createSession, WICSession, Contact } from "@/wic/engine";
import { sanitizePrompt } from "@/lib/sanitize";
import { observeWorld } from "@/wic/observe";
import { buildForecast } from "@/wic/forecast";

const sessions = new Map<number, WICSession>();

async function getSession(userId: number, world: Awaited<ReturnType<typeof observeWorld>>): Promise<WICSession> {
  const existing = sessions.get(userId);
  if (existing) return existing;

   let defaultCurrency = "USD";
  try {
    const u = await db.execute("SELECT reporting_currency FROM users WHERE id = ?", [userId]);
    defaultCurrency = ((u.rows[0] as any)?.reporting_currency as string) || "USD";
  } catch {}

  // Contacts enriched with real history: typical amount + payment cadence
  const stats = new Map<string, { count: number; outs: number[]; days: number[] }>();
  for (const t of world.transactions) {
    if (!stats.has(t.name)) stats.set(t.name, { count: 0, outs: [], days: [] });
    const s = stats.get(t.name)!;
    s.count += 1;
    if (t.type === "out") { s.outs.push(t.amount); s.days.push(new Date(t.createdAt).getTime()); }
  }
  const median = (arr: number[]) => { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const contacts: Contact[] = [...stats.entries()]
    .filter(([, s]) => s.count >= 2)
    .map(([name, s]) => {
      let cadenceDays: number | undefined;
      if (s.outs.length >= 3) {
        const sorted = [...s.days].sort((a, b) => a - b);
        const gaps: number[] = [];
        for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 86400000);
        const g = Math.round(median(gaps));
        if (g > 0) cadenceDays = g;
      }
      const typical = median(s.outs);
      return {
        id: name, name, aliases: [],
        typicalAmount: typical > 0 ? typical : undefined,
        typicalCurrency: typical > 0 ? defaultCurrency : undefined,
        cadenceDays,
      };
    });
  for (const o of world.obligations) {
    if (!contacts.some((c) => c.name.toLowerCase() === o.recipient.toLowerCase())) {
      contacts.push({ id: o.recipient, name: o.recipient, aliases: [] });
    }
  }
  const seed = world.transactions
    .filter((t) => t.type === "out")
    .slice(0, 20)
    .map((t) => ({ recipient: t.name, amount: t.amount, currency: defaultCurrency, at: new Date(t.createdAt).getTime() }));

  const session = createSession({ defaultCurrency, contacts, largeAmountThreshold: 10_000, liquidityUsd: world.totalUsd, seed });
  sessions.set(userId, session);
  return session;
}

async function saveTurn(userId: number, history: { role: string; content: string }[], prompt: string, reply: string) {
  history.push({ role: "user", content: prompt });
  history.push({ role: "assistant", content: reply });
  await db.execute(
    "INSERT INTO conversations (user_id, messages) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET messages = excluded.messages, updated_at = CURRENT_TIMESTAMP",
    [userId, JSON.stringify(history.slice(-10))]
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const userId = session.userId;

    const rate = checkRateLimit(userId);
    if (!rate.allowed) {
      return NextResponse.json({ success: false, message: `Too many requests. Try again in ${rate.retryAfter} seconds.` }, { status: 429 });
    }

    const { prompt: rawPrompt } = await req.json();
    const prompt = sanitizePrompt(rawPrompt || "");
    if (!prompt) return NextResponse.json({ success: false, message: "Please enter a valid command." });

    const convRes = await db.execute("SELECT messages FROM conversations WHERE user_id = ?", [userId]);
    let history: { role: string; content: string }[] = [];
    if (convRes.rows.length > 0) {
      try { history = JSON.parse((convRes.rows[0] as any).messages); } catch {}
    }

    const world = await observeWorld(userId);
    const wicSession = await getSession(userId, world);
    const wicResult = wicProcess(prompt, wicSession);

    // Specific-wallet balance query
    if (wicResult.type === "BALANCE_QUERY" && wicResult.data?.currency) {
      const currency = wicResult.data.currency as string;
      const walletRes = await db.execute(
        "SELECT balance FROM wallets WHERE user_id = ? AND currency = ? AND is_active = 1",
        [userId, currency]
      );
      let message: string;
      if (walletRes.rows.length > 0) {
        const balance = Number((walletRes.rows[0] as any).balance);
        message = `You have ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency} in your ${currency} wallet.`;
      } else {
        message = `I don't see an active ${currency} wallet on your account. Want me to show all your balances?`;
      }
      await saveTurn(userId, history, prompt, message);
      return NextResponse.json({ success: false, message });
    }

    // Forecast
    if (wicResult.type === "FORECAST") {
      const message = buildForecast(world).sentence;
      await saveTurn(userId, history, prompt, message);
      return NextResponse.json({ success: false, message });
    }

    // All-wallets balance query
    if (wicResult.type === "INFO" && /\b(balance|how much|show me|my wallets)\b/i.test(prompt)) {
      const walletsResult = await db.execute("SELECT currency, balance FROM wallets WHERE user_id = ? AND is_active = 1", [userId]);
      if (walletsResult.rows.length > 0) {
        const lines = walletsResult.rows.map((r) => `${r.currency}: ${Number(r.balance).toLocaleString()}`).join("\n");
        const message = `Here's your current balance:\n${lines}`;
        await saveTurn(userId, history, prompt, message);
        return NextResponse.json({ success: false, message });
      }
    }

    await saveTurn(userId, history, prompt, wicResult.message);

    const isDraft =
      wicResult.type === "PAYMENT_DRAFT" || wicResult.type === "CONVERSION_DRAFT" ||
      wicResult.type === "ADD_FUNDS_DRAFT" || wicResult.type === "LINK_DRAFT" ||
      wicResult.type === "RECURRING_DRAFT" || wicResult.type === "CORRECTION_DRAFT";

    if (isDraft) {
      const uuid = randomUUID();
      const actionType =
        wicResult.type === "PAYMENT_DRAFT" || wicResult.type === "CORRECTION_DRAFT" ? "executePayment" :
        wicResult.type === "CONVERSION_DRAFT" ? "executeConversionAndPayment" :
        wicResult.type === "LINK_DRAFT" ? "createPaymentLink" :
        wicResult.type === "RECURRING_DRAFT" ? "createWireRoll" :
        "addFunds";

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const payload: Record<string, any> = { ...(wicResult.data || {}) };
      for (const k of Object.keys(payload)) {
        if (payload[k] === null || payload[k] === undefined) delete payload[k];
      }
      delete payload.recipientContactId;

      try {
        await db.execute(
          "INSERT INTO ai_drafts (uuid, action_type, payload, expires_at) VALUES (?, ?, ?, ?)",
          [uuid, actionType, JSON.stringify(payload), expiresAt]
        );
      } catch (e) {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS ai_drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            action_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await db.execute(
          "INSERT INTO ai_drafts (uuid, action_type, payload, expires_at) VALUES (?, ?, ?, ?)",
          [uuid, actionType, JSON.stringify(payload), expiresAt]
        );
      }

      return NextResponse.json({
        success: true,
        draft: {
          uuid, actionType, payload, expiresAt,
          message: wicResult.message,
          requiresConfirmation: !!wicResult.requiresConfirmation,
          confirmationReason: wicResult.confirmationReason || null,
        },
      });
    }

    return NextResponse.json({ success: false, message: wicResult.message });
  } catch (error: any) {
    console.error("AI Orchestrator Error:", error);
    return NextResponse.json({ success: false, message: "I encountered an error processing your request. Please try again." }, { status: 500 });
  }
}