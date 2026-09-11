import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { sanitizePrompt } from "@/lib/sanitize";
import { formatErrorResponse, AuthenticationError, ValidationError } from "@/lib/errors";
import { getLiveUsdRates } from "@/lib/fx"; // <-- ADDED: Live FX Rates Import

import { observeWorld } from "@/wic/observe";
import { buildBriefing } from "@/wic/intelligence";
import { synapseReason, SynapseResponse } from "@/wic/synapse";
import { wicProcess, createSession, WICSessionConfig, Contact } from "@/wic/engine";
import { checkCompleteness, GuardrailResult } from "@/wic/guardrails";

// ─── Validation ────────────────────────────────────────────────
const aiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(500, "Prompt is too long"),
});

// ─── Main API Handler ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Rate Limiting
    const session = await verifySession();
    if (!session) {
      throw new AuthenticationError("Unauthorized access to AI engine.");
    }
    const userId = session.userId;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    await checkRateLimit(`ip:${ip}`, "ai");

    // 2. Prompt Validation
    const body = await req.json();
    const validated = aiRequestSchema.parse(body);
    const prompt = sanitizePrompt(validated.prompt);
    
    if (!prompt) {
      throw new ValidationError("Please enter a valid command.");
    }

    // 3. Fetch State (History & World Model)
    const convRes = await db.execute(
      "SELECT messages FROM conversations WHERE user_id = $1", 
      [userId]
    );
    
    let history: { role: string; content: string }[] = [];
    if (convRes.rows.length > 0) {
      try {
        history = JSON.parse((convRes.rows[0] as any).messages);
      } catch {
        // Ignore parse errors, start fresh
      }
    }

    const world = await observeWorld(userId);
    buildBriefing(world);

    // 4. LLM Reasoning with Context (Hybrid Approach)
    const recentHistory = history
      .slice(-4)
      .map((h) => `${h.role === "user" ? "User" : "WIC"}: ${h.content}`)
      .join("\n");
    
    const context = `
      User Wallets: ${world.wallets.map((w: any) => `${w.balance} ${w.currency}`).join(", ")}.
      Recent Conversation:
      ${recentHistory}
    `;

    const synapseResult: SynapseResponse = await synapseReason(prompt, context);

    // 5. 🛡️ DETERMINISTIC GUARDRAIL
    const guardrailCheck: GuardrailResult = checkCompleteness({
      intent: synapseResult.intent,
      entities: synapseResult.entities,
    });

    if (guardrailCheck.blocked && guardrailCheck.clarificationQuestion) {
      synapseResult.needsClarification = true;
      synapseResult.clarificationQuestion = guardrailCheck.clarificationQuestion;
    }

    // 6. Handle Clarification (Early Return)
    if (synapseResult.needsClarification && synapseResult.clarificationQuestion) {
      const message = synapseResult.clarificationQuestion;
      
      await db.execute(
        "INSERT INTO conversations (user_id, messages) VALUES ($1, $2) ON CONFLICT(user_id) DO UPDATE SET messages = excluded.messages, updated_at = CURRENT_TIMESTAMP",
        [userId, JSON.stringify([...history.slice(-9), { role: "user", content: prompt }, { role: "assistant", content: message }])]
      );
      
      return NextResponse.json({ success: true, message });
    }

    // 7. Draft Construction with EXPLICIT Payload Shapes
    let defaultCurrency = "USD";
    try {
      const u = await db.execute("SELECT reporting_currency FROM users WHERE id = $1", [userId]);
      const row = u.rows[0] as { reporting_currency?: string } | undefined;
      defaultCurrency = row?.reporting_currency || "USD";
    } catch {
      // Fallback to USD on DB error
    }

    const stats = new Map<string, { count: number; outs: number[]; days: number[] }>();
    for (const t of world.transactions) {
      if (!stats.has(t.name)) stats.set(t.name, { count: 0, outs: [], days: [] });
      const s = stats.get(t.name)!;
      s.count += 1;
      if (t.type === "out") {
        s.outs.push(t.amount);
        s.days.push(new Date(t.createdAt).getTime());
      }
    }

    const median = (arr: number[]) => {
      if (!arr.length) return 0;
      const a = [...arr].sort((x, y) => x - y);
      return a[Math.floor(a.length / 2)];
    };

    const contacts: Contact[] = [...stats.entries()]
      .filter(([, s]) => s.count >= 2)
      .map(([name, s]) => {
        let cadenceDays: number | undefined;
        if (s.outs.length >= 3) {
          const sorted = [...s.days].sort((a, b) => a - b);
          const gaps: number[] = [];
          for (let i = 1; i < sorted.length; i++) {
            gaps.push((sorted[i] - sorted[i - 1]) / 86400000);
          }
          const g = Math.round(median(gaps));
          if (g > 0) cadenceDays = g;
        }
        const typical = median(s.outs);
        return {
          id: name,
          name,
          aliases: [],
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
      .map((t) => ({
        recipient: t.name,
        amount: t.amount,
        currency: defaultCurrency,
        at: new Date(t.createdAt).getTime(),
      }));

    const wicConfig: WICSessionConfig = {
      defaultCurrency,
      contacts,
      largeAmountThreshold: 10_000,
      liquidityUsd: world.totalUsd,
      seed,
    };

    const wicSession = createSession(wicConfig);
    
    // ─── CRITICAL FIX: Fetch Live FX Rates for Accurate Math ───
    let fxRates: Record<string, number> = {};
    try {
      fxRates = await getLiveUsdRates();
    } catch (error) {
      console.warn("Failed to fetch live FX rates for AI, using safe defaults", error);
      fxRates = { USD: 1, KES: 130, EUR: 0.92, GBP: 0.79 }; // Safe fallback
    }
    // ───────────────────────────────────────────────────────────

    let draftType = "INFO";
    let message = "I've processed your request.";
    let payloadData: Record<string, any> = {};

    if (synapseResult.intent === "PAYMENT") {
      draftType = "PAYMENT_DRAFT";
      message = `Drafting a payment of ${synapseResult.entities.amount} ${synapseResult.entities.currency} to ${synapseResult.entities.recipient}.`;
      payloadData = {
        recipient: synapseResult.entities.recipient,
        amount: synapseResult.entities.amount,
        currency: synapseResult.entities.currency,
        rail: "Auto",
        method: "Auto",
        description: "",
      };
    } else if (synapseResult.intent === "CONVERT") {
      draftType = "CONVERSION_DRAFT";
      
           // Calculate live rate mathematically using fetched data (with null fallbacks)
      const fromCurrency = synapseResult.entities.currency || 'USD';
      const toCurrency = synapseResult.entities.targetCurrency || 'USD';
      const fromRate = fxRates[fromCurrency] || 1;
      const toRate = fxRates[toCurrency] || 1;
      const rate = toRate / fromRate;
      const amount = synapseResult.entities.amount ?? 0;
      const convertedAmount = amount * rate;
      message = `Drafting a conversion of ${amount} ${synapseResult.entities.currency || ''} to ${synapseResult.entities.targetCurrency || ''}...`;
      
      payloadData = {
        fromCurrency: synapseResult.entities.currency,
        toCurrency: synapseResult.entities.targetCurrency,
        amount: synapseResult.entities.amount,
        rate: rate,
        convertedAmount: convertedAmount,
        recipient: "Self",
        rail: "Internal FX",
      };
    } else if (synapseResult.intent === "ANALYSIS") {
      message = synapseResult.reasoning || "Based on current data, this appears to be a reasonable time to proceed.";
      
      await db.execute(
        "INSERT INTO conversations (user_id, messages) VALUES ($1, $2) ON CONFLICT(user_id) DO UPDATE SET messages = excluded.messages, updated_at = CURRENT_TIMESTAMP",
        [userId, JSON.stringify([...history.slice(-9), { role: "user", content: prompt }, { role: "assistant", content: message }])]
      );
      
      return NextResponse.json({ success: true, message });
    } else {
      // FALLBACK TO DETERMINISTIC ENGINE (Handles UNKNOWN, slot-filling, and LLM failures)
      // CRITICAL FIX: Pass fxRates into wicProcess so the fallback also has live math
      const wicResult = wicProcess(prompt, wicSession, fxRates);
      message = wicResult.message;
      draftType = wicResult.type;
      payloadData = wicResult.data || {};
    }

    // 8. Draft Persistence
    const isDraft = [
      "PAYMENT_DRAFT",
      "CONVERSION_DRAFT",
      "ADD_FUNDS_DRAFT",
      "LINK_DRAFT",
      "RECURRING_DRAFT",
    ].includes(draftType);

    if (isDraft && Object.keys(payloadData).length > 0) {
      const uuid = randomUUID();
      
      const actionTypeMap: Record<string, string> = {
        PAYMENT_DRAFT: "executePayment",
        CONVERSION_DRAFT: "executeConversionAndPayment",
        LINK_DRAFT: "createPaymentLink",
        RECURRING_DRAFT: "createWireRoll",
        ADD_FUNDS_DRAFT: "addFunds",
      };
      
      const actionType = actionTypeMap[draftType] || "executePayment";
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5-minute expiration
      
      const payload: Record<string, any> = { ...payloadData };
      for (const k of Object.keys(payload)) {
        if (payload[k] === null || payload[k] === undefined) {
          delete payload[k];
        }
      }

      await db.execute(
        "INSERT INTO ai_drafts (uuid, user_id, action_type, payload, expires_at) VALUES ($1, $2, $3, $4, $5)",
        [uuid, userId, actionType, JSON.stringify(payload), expiresAt]
      );

      await db.execute(
        "INSERT INTO conversations (user_id, messages) VALUES ($1, $2) ON CONFLICT(user_id) DO UPDATE SET messages = excluded.messages, updated_at = CURRENT_TIMESTAMP",
        [userId, JSON.stringify([...history.slice(-9), { role: "user", content: prompt }, { role: "assistant", content: message }])]
      );

      return NextResponse.json({
        success: true,
        draft: {
          uuid,
          actionType,
          payload,
          expiresAt,
          message,
          requiresConfirmation: draftType === "RECURRING_DRAFT" || (synapseResult.entities.amount ?? 0) > 10000                  ,
          confirmationReason: draftType === "RECURRING_DRAFT"
            ? "Recurring payments run automatically until cancelled."
            : (synapseResult.entities.amount ?? 0) > 10000                   
              ? `This is a large transfer (${synapseResult.entities.amount} ${synapseResult.entities.currency}). Please confirm.` 
              : null,
        },
      });
    }

    await db.execute(
      "INSERT INTO conversations (user_id, messages) VALUES ($1, $2) ON CONFLICT(user_id) DO UPDATE SET messages = excluded.messages, updated_at = CURRENT_TIMESTAMP",
      [userId, JSON.stringify([...history.slice(-9), { role: "user", content: prompt }, { role: "assistant", content: message }])]
    );

    return NextResponse.json({ success: true, message });

  } catch (error: unknown) {
    const { response } = formatErrorResponse(error);
    return response;
  }
}