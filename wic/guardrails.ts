// ============================================================
// WIC Guardrails — Deterministic Completeness Gate (v2)
// Location: wic/guardrails.ts
// ============================================================

import { 
  SUPPORTED_CURRENCIES, 
  VALID_FREQUENCIES, 
  isValidCurrency, 
  isValidFrequency 
} from "@/lib/constants";

export type Intent =
  | "PAYMENT" | "CONVERT" | "TOPUP" | "REQUEST" | "RECURRING"
  | "BALANCE" | "ANALYSIS" | "UNKNOWN";

export interface Entities {
  recipient: string | null;
  /** Set when a raw name matched more than one known contact. Takes priority over "missing". */
  recipientCandidates?: string[];
  amount: number | null;
  currency: string | null;
  targetCurrency: string | null;
  frequency: string | null;
}

export interface ProposedDraft {
  intent: Intent;
  entities: Entities;
}

export type GuardrailReason = "complete" | "missing" | "invalid" | "ambiguous";

export interface GuardrailResult {
  blocked: boolean;
  reason: GuardrailReason;
  missingFields?: FieldKey[];
  invalidFields?: { field: FieldKey; why: string }[];
  clarificationQuestion?: string;
}

type FieldKey = keyof Omit<Entities, "recipientCandidates">;

// ─── What "required" means per intent — exhaustive on purpose ──

const REQUIRED_FIELDS: Record<Intent, FieldKey[] | null> = {
  PAYMENT: ["recipient", "amount", "currency"],
  CONVERT: ["amount", "currency", "targetCurrency"],
  TOPUP: ["amount", "currency"],
  REQUEST: ["amount", "currency"],
  RECURRING: ["recipient", "amount", "currency", "frequency"],
  BALANCE: null,
  ANALYSIS: null,
  UNKNOWN: null,
};

// ─── Field-level validity — presence is necessary, not sufficient ──
// Now uses the centralized helpers from constants.ts

const FIELD_VALIDATORS: Partial<Record<FieldKey, (value: unknown) => string | null>> = {
  recipient: (v) => (typeof v === "string" && v.trim().length > 0 ? null : "empty"),
  amount: (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? null : "not a positive number"),
  currency: (v) => (typeof v === "string" && isValidCurrency(v) ? null : "not a supported currency"),
  targetCurrency: (v) => (typeof v === "string" && isValidCurrency(v) ? null : "not a supported currency"),
  frequency: (v) => (typeof v === "string" && isValidFrequency(v) ? null : "not a recognized frequency"),
};

// ─── Cross-field rules ─────────────────────────────────────────

type CrossFieldRule = (e: Entities) => string | null;

const CROSS_FIELD_RULES: Partial<Record<Intent, CrossFieldRule[]>> = {
  CONVERT: [
    (e) =>
      e.currency && e.targetCurrency && e.currency.toUpperCase() === e.targetCurrency.toUpperCase()
        ? `You're converting ${e.currency} to itself — did you mean a different currency?`
        : null,
  ],
};

// ─── Natural-language field prompts, composed dynamically ──────

const FIELD_PROMPT: Record<FieldKey, string> = {
  recipient: "who you'd like to send it to",
  amount: "how much",
  currency: "which currency",
  targetCurrency: "which currency to convert into",
  frequency: "how often (e.g. weekly or monthly)",
};

// ─── Main entry point ─────────────────────────────────────────

export function checkCompleteness(draft: ProposedDraft): GuardrailResult {
  const { intent, entities } = draft;

  // Ambiguity outranks "missing"
  if (entities.recipientCandidates && entities.recipientCandidates.length > 0) {
    const list = entities.recipientCandidates.map((n) => `"${n}"`).join(" or ");
    return {
      blocked: true,
      reason: "ambiguous",
      clarificationQuestion: `I found more than one match — did you mean ${list}?`,
    };
  }

  const required = REQUIRED_FIELDS[intent];
  if (!required) return { blocked: false, reason: "complete" };

  const missing: FieldKey[] = [];
  const invalid: { field: FieldKey; why: string }[] = [];

  for (const field of required) {
    const value = entities[field];
    if (value === null || value === undefined) {
      missing.push(field);
      continue;
    }
    const problem = FIELD_VALIDATORS[field]?.(value) ?? null;
    if (problem) invalid.push({ field, why: problem });
  }

  if (invalid.length > 0) {
    return {
      blocked: true,
      reason: "invalid",
      invalidFields: invalid,
      clarificationQuestion: buildInvalidQuestion(invalid[0]),
    };
  }

  if (missing.length > 0) {
    return {
      blocked: true,
      reason: "missing",
      missingFields: missing,
      clarificationQuestion: buildMissingQuestion(missing, entities),
    };
  }

  for (const rule of CROSS_FIELD_RULES[intent] ?? []) {
    const problem = rule(entities);
    if (problem) return { blocked: true, reason: "invalid", clarificationQuestion: problem };
  }

  return { blocked: false, reason: "complete" };
}

// ─── Question composition ─────────────────────────────────────

function buildMissingQuestion(missing: FieldKey[], entities: Entities): string {
  const known = knownFragment(entities);
  const asks = missing.map((f) => FIELD_PROMPT[f]);
  const askText = capitalize(joinNaturally(asks));
  return known ? `${known}. ${askText}?` : `${askText}?`;
}

function knownFragment(e: Entities): string | null {
  const parts: string[] = [];
  if (e.amount != null && e.currency != null) parts.push(`${e.amount.toLocaleString()} ${e.currency.toUpperCase()}`);
  else if (e.amount != null) parts.push(`${e.amount.toLocaleString()}`);
  else if (e.currency != null) parts.push(`in ${e.currency.toUpperCase()}`);
  if (e.recipient) parts.push(`to ${e.recipient}`);
  return parts.length > 0 ? `Got it — ${parts.join(" ")}` : null;
}

function buildInvalidQuestion(problem: { field: FieldKey; why: string }): string {
  const supported = Array.from(SUPPORTED_CURRENCIES).join(", ");
  switch (problem.field) {
    case "amount":
      return "That amount doesn't look right — could you give me a specific number greater than zero?";
    case "currency":
      return `I don't support that currency yet — could you use ${supported}?`;
    case "targetCurrency":
      return `I don't support converting into that currency yet — try ${supported}.`;
    case "frequency":
      return `How often should this repeat — ${Array.from(VALID_FREQUENCIES).join(", ")}?`;
    case "recipient":
      return "Who would you like this to go to?";
    default:
      return `Could you clarify ${problem.field}?`;
  }
}

function joinNaturally(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}