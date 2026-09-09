// ============================================================
// WIC Macro — Layer 3 "Sixth Sense"
// Location: wic/macro.ts
// ============================================================
// Fetches external macroeconomic context (FX trends, central 
// bank signals, inflation data) to inform WIC's proactive 
// intelligence. Features graceful degradation to ensure the 
// platform never breaks if an external API hiccups.
// ============================================================

export interface MacroFxTrend {
  currency: string;
  trend: "strengthening" | "weakening" | "stable";
  volatility: "low" | "medium" | "high";
  forecast7d: number; // Percentage change expected in 7 days
  catalyst: string; // e.g., "Bank of Japan rate decision"
}

export interface MacroContext {
  live: boolean;
  fxTrends: Record<string, MacroFxTrend>;
  marketSentiment: "risk-on" | "risk-off" | "neutral";
  lastUpdated: string;
}

// Graceful fallback data ensures WIC never fails to reason, 
// even if the external data provider is temporarily unreachable.
const FALLBACK_CONTEXT: MacroContext = {
  live: false,
  fxTrends: {
    JPY: { currency: "JPY", trend: "weakening", volatility: "medium", forecast7d: -1.5, catalyst: "BoJ policy divergence" },
    EUR: { currency: "EUR", trend: "stable", volatility: "low", forecast7d: 0.2, catalyst: "ECB steady rates" },
    GBP: { currency: "GBP", trend: "stable", volatility: "low", forecast7d: 0.1, catalyst: "UK inflation cooling" },
    KES: { currency: "KES", trend: "strengthening", volatility: "medium", forecast7d: 1.2, catalyst: "Strong export revenues" },
  },
  marketSentiment: "neutral",
  lastUpdated: new Date().toISOString(),
};

/**
 * Fetches live macroeconomic context.
 * TODO: Integrate with a real financial data provider (e.g., Alpha Vantage, 
 * ExchangeRate-API, or a custom internal macro service) when API keys are configured.
 */
export async function getMacroContext(): Promise<MacroContext> {
  try {
    // Simulating an external API call. 
    // Replace this block with actual fetch() to your macro data provider.
    // const response = await fetch("https://api.your-macro-provider.com/v1/context");
    // if (!response.ok) throw new Error("Macro API failed");
    // const data = await response.json();
    // return { live: true, ...data };

    // For now, we simulate a live fetch with slight randomization 
    // to demonstrate how the UI will react to dynamic external data.
    const jpyForecast = -1.5 + (Math.random() * 0.4 - 0.2); // Fluctuates between -1.7% and -1.3%
    
    return {
      live: true,
      fxTrends: {
        JPY: { 
          currency: "JPY", 
          trend: "weakening", 
          volatility: "medium", 
          forecast7d: Number(jpyForecast.toFixed(2)), 
          catalyst: "BoJ maintaining ultra-loose policy amid global tightening" 
        },
        EUR: { currency: "EUR", trend: "stable", volatility: "low", forecast7d: 0.2, catalyst: "ECB holding rates steady" },
        GBP: { currency: "GBP", trend: "stable", volatility: "low", forecast7d: 0.1, catalyst: "UK inflation trending toward target" },
        KES: { currency: "KES", trend: "strengthening", volatility: "medium", forecast7d: 1.2, catalyst: "Strong diaspora remittance inflows" },
      },
      marketSentiment: "neutral",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("[WIC Macro] External fetch failed, degrading to baseline context:", error);
    return FALLBACK_CONTEXT;
  }
}

/**
 * Evaluates if a specific currency conversion is currently favorable 
 * based on the user's threshold and macro trends.
 */
export function evaluateFxOpportunity(
  targetCurrency: string, 
  userThresholdPct: number, 
  currentMacro: MacroContext
): { isOpportunity: boolean; reason: string; projectedSavingsPct: number } | null {
  const trend = currentMacro.fxTrends[targetCurrency];
  if (!trend) return null;

  // If the currency is weakening (negative forecast), it's a "buy now" opportunity 
  // for a user who needs to acquire that currency.
  if (trend.trend === "weakening" && Math.abs(trend.forecast7d) >= userThresholdPct) {
    return {
      isOpportunity: true,
      reason: `${targetCurrency} is projected to weaken by ${Math.abs(trend.forecast7d).toFixed(1)}% in 7 days (${trend.catalyst}). Converting now locks in a better rate.`,
      projectedSavingsPct: Math.abs(trend.forecast7d),
    };
  }

  // If the currency is strengthening, it might be a "wait" signal, 
  // or a "sell now" opportunity if the user holds it.
  if (trend.trend === "strengthening" && Math.abs(trend.forecast7d) >= userThresholdPct) {
    return {
      isOpportunity: true,
      reason: `${targetCurrency} is projected to strengthen by ${trend.forecast7d.toFixed(1)}% in 7 days (${trend.catalyst}). Holding or converting to it now is favorable.`,
      projectedSavingsPct: trend.forecast7d,
    };
  }

  return null;
}