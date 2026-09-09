// ============================================================
// WIC Reasoning — Proactive Intelligence Engine
// Location: wic/reasoning.ts
// ============================================================
// Synthesizes the user's internal financial reality (WorldModel)
// with external macro trends to generate proactive, natural-language
// insights. Uses the Synapse LLM router for natural language generation.
// ============================================================

import { WorldModel } from "./observe";
import { synapseReason } from "./synapse";

export interface ProactiveInsight {
  id: string;
  type: "fx_opportunity" | "funding_gap" | "liquidity_alert" | "general_advice";
  title: string;
  detail: string;
  actionLabel?: string;
  actionPayload?: string;
  confidence: number;
}

export async function generateProactiveInsights(world: WorldModel): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];

  // 1. Construct a rich, structured context for the LLM
  const context = `
    USER FINANCIAL CONTEXT:
    - Total Liquidity: $${Math.round(world.totalUsd).toLocaleString()} USD
    - Runway: ${world.liquidityDays} days
    - Active Wallets: ${world.wallets.map(w => `${w.currency} (${w.balance})`).join(", ")}
    - Upcoming Obligations: ${world.obligations.map(o => `${o.name} (${o.amount} ${o.currency}) in ${o.daysUntilRun} days`).join("; ") || "None"}
    - Recent FX Activity: ${world.transactions.filter(t => t.rail === "Internal FX").slice(0, 3).map(t => `${t.name}`).join(", ") || "None"}
  `;

  // 2. Ask the LLM to analyze this context and generate insights
  const prompt = `Analyze the user's financial context above. Identify up to 2 highly actionable, proactive insights. 
  Focus on: 
  1. Funding gaps for upcoming obligations.
  2. FX opportunities (e.g., if they hold a currency that is strong, or need to buy one that is weak).
  3. Liquidity warnings if runway is under 14 days.
  
  Return ONLY a valid JSON array of insights matching this schema:
  [
    {
      "id": "string",
      "type": "fx_opportunity" | "funding_gap" | "liquidity_alert" | "general_advice",
      "title": "string (short, punchy)",
      "detail": "string (1-2 sentences explaining the 'why')",
      "actionLabel": "string (e.g., 'Convert now', 'Top up') or null",
      "actionPayload": "string (the exact prompt to prefill in the AI dock) or null",
      "confidence": number (0.0 to 1.0)
    }
  ]`;

  try {
    const response = await synapseReason(prompt, context);
    
    // The LLM returns a JSON string in the 'reasoning' or we parse it if it returned an array
    // Since we forced JSON array, we try to parse the reasoning or the raw output
    let parsedInsights: any[] = [];
    try {
      // Groq/Gemini might wrap the array in a markdown block or return it directly
      const cleaned = response.reasoning.replace(/^```json\s*|\s*```$/g, "").trim();
      parsedInsights = JSON.parse(cleaned);
    } catch (e) {
      console.warn("[Reasoning] LLM did not return a valid JSON array. Falling back to deterministic rules.");
    }

    if (Array.isArray(parsedInsights)) {
      for (const insight of parsedInsights) {
        insights.push({
          id: insight.id || `insight-${Date.now()}`,
          type: insight.type,
          title: insight.title,
          detail: insight.detail,
          actionLabel: insight.actionLabel,
          actionPayload: insight.actionPayload,
          confidence: insight.confidence || 0.8,
        });
      }
    }
  } catch (error) {
    console.error("[Reasoning] Failed to generate proactive insights:", error);
  }

  // 3. Deterministic Fallback: If LLM fails or returns nothing, ensure critical gaps are still shown
  if (insights.length === 0) {
    const attentionObligations = world.obligations.filter(o => !o.fullyFunded);
    if (attentionObligations.length > 0) {
      const gap = attentionObligations[0];
      insights.push({
        id: "fallback-gap",
        type: "funding_gap",
        title: `Funding gap for ${gap.name}`,
        detail: `You are short ${gap.gaps.map(g => `${g.shortfall} ${g.currency}`).join(" and ")}.`,
        actionLabel: "Auto-Fund",
        actionPayload: `Auto-fund ${gap.name}`,
        confidence: 0.95,
      });
    }
  }

  return insights.slice(0, 2); // Cap at 2 high-quality insights
}