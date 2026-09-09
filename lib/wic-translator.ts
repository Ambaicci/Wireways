/**
 * WIC Translation Layer
 * Translates complex financial/engineering events into simple, 
 * protective, and human-readable language for the user.
 */

export type FXEvent = 
  | "QUOTE_CREATED" 
  | "QUOTE_EXPIRED" 
  | "SLIPPAGE_ABORTED" 
  | "CONVERSION_SUCCESS" 
  | "SMART_ROUTING_APPLIED";

export interface WICMessage {
  headline: string;
  body: string;
  tone: "success" | "warning" | "info" | "error";
}

export function getWICMessage(event: FXEvent, context?: any): WICMessage {
  switch (event) {
    case "QUOTE_CREATED":
      return {
        headline: "Rate locked for 60 seconds.",
        body: `I've secured the current exchange rate for you. You have 1 minute to confirm this transfer before the market changes.`,
        tone: "info"
      };

    case "QUOTE_EXPIRED":
      return {
        headline: "The rate lock has expired.",
        body: `The 60-second window passed. Exchange rates change constantly, so I cleared the old quote. Ask me again for a fresh rate.`,
        tone: "warning"
      };

    case "SLIPPAGE_ABORTED":
      return {
        headline: "Transfer paused to protect your funds.",
        body: `The exchange rate moved too fast while you were confirming. I stopped the transaction so you wouldn't get a worse deal than we agreed on. Try again for a new rate.`,
        tone: "error"
      };

    case "CONVERSION_SUCCESS":
      return {
        headline: "Conversion completed.",
        body: `Successfully moved ${context.amount} ${context.from} to ${context.converted} ${context.to} at the locked rate. Your ledger is updated.`,
        tone: "success"
      };

    case "SMART_ROUTING_APPLIED":
      return {
        headline: "I found a cheaper path.",
        body: `Instead of converting directly, I routed this through a more liquid pool to save you ${context.savings} in fees.`,
        tone: "success"
      };

    default:
      return {
        headline: "Update",
        body: "Transaction processed.",
        tone: "info"
      };
  }
}