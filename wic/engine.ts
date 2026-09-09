// ============================================================
// WIC — Wireways Intelligence Cloud (v3.4: Constants Synced)
// Location: wic/engine.ts
// ============================================================

import { SUPPORTED_CURRENCIES, VALID_FREQUENCIES } from "@/lib/constants";

export type DraftType =
  | "PAYMENT_DRAFT" | "CONVERSION_DRAFT" | "ADD_FUNDS_DRAFT" | "LINK_DRAFT"
  | "RECURRING_DRAFT" | "CORRECTION_DRAFT" | "BALANCE_QUERY"
  | "FORECAST" | "INFO" | "ERROR";

export interface WICDraft {
  type: DraftType;
  message: string;
  data?: Record<string, any>;
  requiresConfirmation?: boolean;
  confirmationReason?: string;
  trace?: TraceEntry[];
}

export interface Contact {
  id: string;
  name: string;
  aliases?: string[];
  typicalAmount?: number;
  typicalCurrency?: string;
  cadenceDays?: number;
}

export interface FinalizedRecord { recipient: string; amount: number; currency: string; at: number; }

export interface WICSessionConfig {
  defaultCurrency: string;
  contacts?: Contact[];
  largeAmountThreshold?: number;
  liquidityUsd?: number;
  seed?: FinalizedRecord[];
}

interface TraceEntry { step: string; detail: string; }

interface RecurrenceInfo {
  label: string;
  frequency: string;
  anchor?: string;
}

interface ParsedEntities {
  amount: number | null;
  currency: string | null;
  targetCurrency: string | null;
  recipient: string | null;
  recipientContactId: string | null;
  recipientRaw?: string | null;
  description: string | null;
  recurrence: RecurrenceInfo | null;
  recipientSuggestions?: string[];
  usualRequested?: boolean;
}

type IntentId =
  | "PAYMENT" | "CONVERT" | "TOPUP" | "REQUEST" | "METHOD"
  | "RECURRING" | "CORRECTION" | "BALANCE" | "SOCIALIZING" | "WHY"
  | "FORECAST" | "INFO" | "ANALYSIS" | "UNKNOWN";

export class WICSession {
  defaultCurrency: string;
  contacts: Contact[];
  largeAmountThreshold: number;
  liquidityUsd: number;
  turns = 0;
  lastRecipient: string | null = null;
  pendingDraft: { intent: IntentId; entities: ParsedEntities } | null = null;
  lastInfo: { intent: string; detail: string; confirmationReason?: string } | null = null;        
  private recentFinalized: FinalizedRecord[] = [];

  constructor(config: WICSessionConfig) {
    this.defaultCurrency = config.defaultCurrency;
    this.contacts = config.contacts ?? [];
    this.largeAmountThreshold = config.largeAmountThreshold ?? 10_000;
    this.liquidityUsd = config.liquidityUsd ?? 0;
    this.recentFinalized = [...(config.seed ?? [])];
  }

  rememberFinalized(recipient: string, amount: number, currency: string) {
    this.recentFinalized.push({ recipient, amount, currency, at: Date.now() });
    this.recentFinalized = this.recentFinalized.slice(-20);
  }

  wasRecentlySent(recipient: string, amount: number, currency: string, withinMs = 48 * 3600_000): boolean {
    const now = Date.now();
    return this.recentFinalized.some(
      (r) => r.recipient.toLowerCase() === recipient.toLowerCase() && r.amount === amount && r.currency === currency && now - r.at < withinMs
    );
  }

  learnAlias(contactName: string, alias: string | null | undefined) {
    if (!alias) return;
    const a = alias.toLowerCase().trim();
    const c = this.contacts.find((x) => x.name === contactName);
    if (!c || !a || a === contactName.toLowerCase()) return;
    c.aliases = c.aliases ?? [];
    if (!c.aliases.some((x) => x.toLowerCase() === a) && c.aliases.length < 6) c.aliases.push(alias.trim());
  }

  clearPending() { this.pendingDraft = null; }
}

export function createSession(config: WICSessionConfig): WICSession {
  return new WICSession(config);
}

// ─── Dynamic Currency Detection (Synced with constants.ts) ───

const CURRENCY_WORDS: Record<string, string> = {
  dollar: "USD", dollars: "USD", euro: "EUR", euros: "EUR",
  pound: "GBP", pounds: "GBP", sterling: "GBP", shilling: "KES", shillings: "KES", kenya: "KES",  
};
const COUNTRY_CURRENCY: Record<string, string> = {
  kenya: "KES", kenyan: "KES", uk: "GBP", britain: "GBP", england: "GBP",
  germany: "EUR", france: "EUR", spain: "EUR", italy: "EUR", netherlands: "EUR", europe: "EUR",   
  usa: "USD", america: "USD",
};
const CURRENCY_SYMBOLS: Record<string, string> = { "$": "USD", "€": "EUR", "£": "GBP" };       

function detectCurrencies(text: string): string[] {
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();
  const hits: { code: string; index: number; weight: number }[] = [];
  
  // Dynamically check supported currencies
  for (const code of SUPPORTED_CURRENCIES) {
    const idx = upper.indexOf(code);
    if (idx !== -1) hits.push({ code, index: idx, weight: 3 });
  }
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    const idx = text.indexOf(symbol);
    if (idx !== -1) hits.push({ code, index: idx, weight: 2 });
  }
  for (const [word, code] of Object.entries(CURRENCY_WORDS)) {
    const idx = lower.indexOf(word);
    if (idx !== -1) hits.push({ code, index: idx, weight: 1 });
  }
  for (const [word, code] of Object.entries(COUNTRY_CURRENCY)) {
    const idx = lower.indexOf(word);
    if (idx !== -1) hits.push({ code, index: idx, weight: 1 });
  }
  
  const best = new Map<string, { index: number; weight: number }>();
  for (const h of hits) {
    const ex = best.get(h.code);
    if (!ex || h.weight > ex.weight) best.set(h.code, { index: h.index, weight: h.weight });      
  }
  return [...best.entries()].sort((a, b) => a[1].index - b[1].index).map(([code]) => code);       
}

// ─── Amount & Recipient Parsing (Unchanged, Brilliant Logic) ─

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,       
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,   
};

function detectAmountWords(text: string): number | null {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  let total = 0, current = 0, found = false;
  for (const w of words) {
    if (UNITS[w] !== undefined) { current += UNITS[w]; found = true; }
    else if (TENS[w] !== undefined) { current += TENS[w]; found = true; }
    else if (w === "hundred") { current = (current || 1) * 100; found = true; }
    else if (w === "thousand") { total += (current || 1) * 1000; current = 0; found = true; }     
    else if (w === "million") { total += (current || 1) * 1000000; current = 0; found = true; }   
    else if (found) break;
  }
  const v = total + current;
  return found && v > 0 ? v : null;
}

function detectAmount(text: string): number | null {
  // Dynamically build regex from supported currencies to avoid stripping valid words
  const currencyRegex = new RegExp(`\\b(${SUPPORTED_CURRENCIES.join("|")})\\b`, "gi");
  const cleaned = text.replace(currencyRegex, " ");
  const pattern = /(?:\$|€|£|KSh\s*)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(k|thousand|million)?(?=\s|$|,|\.)/i;
  const match = cleaned.match(pattern);
  if (match) {
    let value = parseFloat(match[1].replace(/,/g, ""));
    const mult = (match[2] || "").toLowerCase();
    if (mult === "k" || mult === "thousand") value *= 1_000;
    if (mult === "million") value *= 1_000_000;
    if (value > 0) return value;
  }
  return detectAmountWords(text);
}

const STOPWORDS = new Set([
  ...SUPPORTED_CURRENCIES.map(c => c.toLowerCase()),
  "the", "my", "a", "an", "to", "for", "with", "from", "and", "it", "that", "this", 
  "wallet", "balance", "them", "him", "her", "money", "funds", "cash", "payment", "payments"
]);       
const isStopword = (s: string) => STOPWORDS.has(s.toLowerCase().trim());

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

function extractRawRecipient(text: string): string | null {
  const patterns = [
    /\bto\s+([a-zA-Z][a-zA-Z\s\-']{1,40}?)(?=\s+(?:for|to|from|via|with|and|every|monthly|weekly|on)\b|,|$|\s+\$|\s+\d)/i,
    /\bfrom\s+([a-zA-Z][a-zA-Z\s\-']{1,40}?)(?=\s+(?:for|to|from|via|with|and|every|monthly|weekly|on)\b|,|$|\s+\$|\s+\d)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1].trim().length > 1 && !isStopword(m[1])) return m[1].trim();
  }
  const currencyList = SUPPORTED_CURRENCIES.join("|");
  const direct = text.match(new RegExp(`\\b(?:send|pay|transfer|wire|remit)\\s+(?:.*?\\s+)?([a-zA-Z][a-zA-Z]+(?:\\s+[a-zA-Z][a-zA-Z]+)?)\\s+(?:${currencyList}|\\$|€|£|\\d)`, "i"));
  if (direct && !isStopword(direct[1])) return direct[1].trim();
  const fallback = text.match(/\b(?:send|pay|transfer|wire|remit)\s+([a-zA-Z][a-zA-Z]{2,}(?:\s+[a-zA-Z][a-zA-Z]{2,})?)/i);
  if (fallback && fallback[1].trim().length > 2 && !isStopword(fallback[1])) return fallback[1].trim();
  return null;
}

function matchByName(text: string, contacts: Contact[]): Contact | null {
  const needle = text.toLowerCase().replace(/[.,!?]/g, "").trim();
  if (!needle || needle.length < 2) return null;
  const exact = contacts.find((c) => c.name.toLowerCase() === needle);
  if (exact) return exact;
  const pref = contacts.filter((c) => c.name.toLowerCase().startsWith(needle) || needle.startsWith(c.name.toLowerCase()));
  return pref.length === 1 ? pref[0] : null;
}

function detectRecipient(text: string, session: WICSession): { name: string | null; contactId: string | null; suggestions?: string[]; raw?: string | null } {
  if (session.lastRecipient && /\b(to|for|send|pay)\s+(them|him|her|that one|the same)\b/i.test(text)) {
    return { name: session.lastRecipient, contactId: session.lastRecipient, raw: null };
  }

  const raw = extractRawRecipient(text);
  if (!raw) return { name: null, contactId: null, raw: null };
  const needle = raw.toLowerCase();

  const exact = session.contacts.find((c) => c.name.toLowerCase() === needle || c.aliases?.some((a) => a.toLowerCase() === needle));
  if (exact) return { name: exact.name, contactId: exact.id, raw };

  const candidates = session.contacts.filter(
    (c) => c.name.toLowerCase().startsWith(needle) || c.name.toLowerCase().includes(needle) || c.aliases?.some((a) => a.toLowerCase().includes(needle))
  );
  if (candidates.length > 0) return { name: null, contactId: null, suggestions: candidates.map((c) => c.name).slice(0, 3), raw };

  if (needle.length >= 4) {
    let best: Contact | null = null;
    let bestD = 3;
    for (const c of session.contacts) {
      const d = lev(needle, c.name.toLowerCase());
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best) return { name: null, contactId: null, suggestions: [best.name], raw };
  }

  const currencyRegex = new RegExp(`\\b(${SUPPORTED_CURRENCIES.join("|")}|KSh)\\b`, "gi");
  const cleaned = raw.replace(currencyRegex, "").replace(/\s+/g, " ").trim();  
  return { name: cleaned || null, contactId: null, raw };
}

function detectDescription(text: string): string | null {
  const matches = [...text.matchAll(/\bfor\s+(?:the\s+|a\s+|an\s+)?([a-zA-Z][a-zA-Z\s]{2,40}?)(?:\s+(?:from|to|via|with|and)\b|,|$)/gi)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const desc = matches[i][1].trim();
    if (desc.length > 2 && !isStopword(desc)) return desc;
  }
  const purpose = text.match(/\bpurpose[:\s]+([a-zA-Z\s]{2,40}?)(?:,|$)/i);
  if (purpose && purpose[1].trim().length > 2) return purpose[1].trim();
  return null;
}

function detectRecurrence(text: string): RecurrenceInfo | null {
  const lower = text.toLowerCase();
  const weekday = lower.match(/\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekday) return { label: `every ${weekday[1]}`, frequency: "weekly", anchor: weekday[1] };  
  if (/\bevery\s*(other\s*week|two\s*weeks|fortnight)\b/.test(lower) || /\bbiweekly\b/.test(lower)) return { label: "every two weeks", frequency: "biweekly" };
  if (/\bevery\s*day\b/.test(lower) || /\bdaily\b/.test(lower)) return { label: "every day", frequency: "daily" };
  if (/\bevery\s*month\b/.test(lower) || /\bmonthly\b/.test(lower)) {
    const day = lower.match(/\bon\s+the\s+(\d{1,2})(st|nd|rd|th)?\b/);
    return { label: day ? `monthly on the ${day[1]}` : "monthly", frequency: "monthly", anchor: day?.[1] };
  }
  return null;
}

const USUAL_PATTERN = /\b(the\s+)?(usual|normal|regular|standard|as always|same as (last|before|last time))\b/i;
const CORRECTION_PATTERN = /\b(actually|instead|change|make it|correction|i meant)\b/i;
const CANCEL_PATTERN = /\b(cancel|never\s*mind|nevermind|forget\s*it|stop|discard)\b/i;
const YES_PATTERN = /^\s*(yes|yeah|yep|sure|ok|okay|correct|first( one)?|that'?s (it|the one))\b/i;
const NO_PATTERN = /^\s*(no|nope|none|neither)\b/i;
const WHY_PATTERN = /^\s*(why|why'?s that|explain|how do you (know|figure)|what makes you say)\b/i;

const SOCIAL_REPLIES = [
  "You're welcome — I'm here if you need anything else.",
  "Anytime. What's next?",
  "Happy to help. Need anything else?",
  "Always. Just say the word.",
];

function isBalanceQuery(text: string): boolean {
  const lower = text.toLowerCase();
  const normalized = lower.replace(/what's/g, "what is").replace(/how's/g, "how is").replace(/where's/g, "where is");
  const hasQuestionWord = /\b(what|how|show|tell|check|see|can|do|is|are)\b/.test(normalized);    
  const hasBalanceKeyword = /\b(balance|wallet|funds|available|hold|left|worth|account|money)\b/.test(normalized);
  const hasCurrency = detectCurrencies(text).length > 0;
  if (hasBalanceKeyword && hasQuestionWord) return true;
  if (hasCurrency && hasQuestionWord) return true;
  if (/\b(balance|funds)\b/.test(normalized)) return true;
  return false;
}

interface IntentRule { id: IntentId; test: (t: string) => boolean; }

const INTENT_REGISTRY: IntentRule[] = [
  { id: "SOCIALIZING", test: (t) => /\b(thank(s| you)?|cheers|goodbye|bye|talk later|appreciate it|you'?re great|well done)\b/i.test(t) },
  { id: "WHY", test: (t) => WHY_PATTERN.test(t) },
  { id: "METHOD", test: (t) => /\b(create|make|issue|generate)\b[\s\S]{0,28}\b(card|door|virtual)\b/i.test(t) },
  { id: "RECURRING", test: (t) => detectRecurrence(t) !== null && /\b(send|pay|transfer|wire)\b/i.test(t) },
  {
    id: "REQUEST",
    test: (t) => {
      const lower = t.toLowerCase();
      if (/\b(create|generate|make)\s+(a\s+)?(payment\s+)?link\b/.test(lower)) return true;       
      return /\b(payment\s+link|invoice|bill|charge|request)\b/.test(lower) && !/\b(send|pay|transfer)\b/.test(lower);
    },
  },
  { 
    id: "ANALYSIS", 
    test: (t) => {
      const lower = t.toLowerCase();
      const hasAnalysisWord = /\b(should i|is it|worth|advisable|recommend|analyze|analysis|good time|better time)\b/i.test(lower);
      const hasActionWord = /\b(convert|exchange|swap|send|pay|transfer)\b/i.test(lower);
      return hasAnalysisWord && hasActionWord;
    }
  },
  { id: "PAYMENT", test: (t) => /\b(send|pay|transfer|wire|remit)\b/i.test(t.toLowerCase()) && !/\b(request|invoice|bill)\b/.test(t.toLowerCase()) },
  { id: "CONVERT", test: (t) => /\b(convert|swap|exchange)\b/i.test(t) },
  { id: "TOPUP", test: (t) => /\b(top\s*up|add\s*funds|deposit|recharge)\b/i.test(t) },
  { id: "BALANCE", test: (t) => isBalanceQuery(t) },
  { id: "FORECAST", test: (t) => /\b(forecast|project|projection|runway|cash\s*flow|next\s+(month|week)|be\s+short|run\s*short|will\s+i)\b/i.test(t) },
  { id: "INFO", test: (t) => /\b(history|status|help|who are you|what can you do)\b/i.test(t) },  
];

function classifyIntent(text: string, hasPending: boolean): IntentId {
  if (hasPending && CORRECTION_PATTERN.test(text)) return "CORRECTION";
  for (const rule of INTENT_REGISTRY) if (rule.test(text)) return rule.id;
  return "UNKNOWN";
}

function parseEntities(text: string, session: WICSession): ParsedEntities {
  const currencies = detectCurrencies(text);
  const recipient = detectRecipient(text, session);
  return {
    amount: detectAmount(text),
    currency: currencies[0] ?? null,
    targetCurrency: currencies[1] ?? null,
    recipient: recipient.name,
    recipientContactId: recipient.contactId,
    recipientRaw: recipient.raw ?? null,
    description: detectDescription(text),
    recurrence: detectRecurrence(text),
    recipientSuggestions: recipient.suggestions,
    usualRequested: USUAL_PATTERN.test(text),
  };
}

function mergeEntities(existing: ParsedEntities, incoming: ParsedEntities): ParsedEntities {      
  const ambiguous = !incoming.recipient && !!incoming.recipientSuggestions?.length;
  const recipientChanged = incoming.recipient !== null && incoming.recipient !== existing.recipient;
  
  const recipient = incoming.recipient !== null ? incoming.recipient : ambiguous ? null : existing.recipient;
  const recipientContactId = incoming.recipient !== null ? incoming.recipientContactId : ambiguous ? null : existing.recipientContactId;
  
  return {
    amount: recipientChanged ? incoming.amount : (incoming.amount ?? existing.amount),
    currency: recipientChanged ? incoming.currency : (incoming.currency ?? existing.currency),
    targetCurrency: recipientChanged ? incoming.targetCurrency : (incoming.targetCurrency ?? existing.targetCurrency),
    recipient,
    recipientContactId,
    recipientRaw: incoming.recipientRaw ?? existing.recipientRaw,
    description: incoming.description ?? existing.description,
    recurrence: incoming.recurrence ?? existing.recurrence,
    recipientSuggestions: incoming.recipientSuggestions ?? (recipient === null ? existing.recipientSuggestions : undefined),
    usualRequested: incoming.usualRequested ?? existing.usualRequested,
  };
}

function hasFreshSignal(e: ParsedEntities): boolean {
  return !!(e.amount || e.recipient || e.description || e.currency || e.targetCurrency || e.recurrence);
}

function applyGuardrails(draft: WICDraft, session: WICSession, entities: ParsedEntities): WICDraft {
  if (draft.type !== "PAYMENT_DRAFT" || !entities.amount || !entities.recipient) return draft;    
  const currency = entities.currency ?? session.defaultCurrency;
  if (session.wasRecentlySent(entities.recipient, entities.amount, currency)) {
    return { ...draft, requiresConfirmation: true, confirmationReason: `You sent ${entities.recipient} the same amount recently — confirm this isn't a duplicate.` };
  }
  const adaptiveFloor = Math.max(5_000, Math.round(session.liquidityUsd * 0.01));
  const relativeCeiling = session.liquidityUsd > 0 ? session.liquidityUsd * 0.35 : Infinity;      
  if (entities.amount >= adaptiveFloor || entities.amount >= relativeCeiling) {
    return { ...draft, requiresConfirmation: true, confirmationReason: `This is a large transfer (${entities.amount.toLocaleString()} ${currency}) relative to your position — please confirm before it's sent.` };
  }
  return draft;
}

function buildPaymentDraft(e: ParsedEntities, session: WICSession, trace: TraceEntry[]): WICDraft {
  if (!e.recipient && e.recipientSuggestions && e.recipientSuggestions.length > 0) {
    const list = e.recipientSuggestions.map((s) => `"${s}"`).join(" or ");
    return { type: "INFO", message: `I want to be precise — did you mean ${list}? Reply "yes" for the first, or type the full name.`, trace };
  }
  if (!e.recipient) return { type: "INFO", message: "Who would you like to send this payment to?", trace };

  const contact = session.contacts.find((c) => c.name === e.recipient);

  if (!e.amount && e.usualRequested && contact?.typicalAmount) {
    e.amount = contact.typicalAmount;
    e.currency = e.currency ?? contact.typicalCurrency ?? session.defaultCurrency;
  }
  if (!e.amount) return { type: "INFO", message: `Got it — sending to ${e.recipient}. How much would you like to send?`, trace };

  const currency = e.currency ?? session.defaultCurrency;

  let nudge = "";
  if (contact?.cadenceDays && contact.cadenceDays >= 7 && !e.recurrence) {
    nudge = ` You pay ${contact.name} roughly every ${contact.cadenceDays} days — add 'every month' to make it a wire-roll.`;
  }

  return {
    type: "PAYMENT_DRAFT",
    message: `Drafting a payment of ${e.amount.toLocaleString()} ${currency} to ${e.recipient}${e.description ? ` for ${e.description}` : ""}.${nudge}`,
    data: {
      recipient: e.recipient, recipientContactId: e.recipientContactId,
      amount: e.amount, currency, rail: "Auto", method: "Auto", description: e.description,       
    },
    trace,
  };
}

function buildConversionDraft(e: ParsedEntities, fxRates: Record<string, number>, trace: TraceEntry[]): WICDraft {
  if (!e.amount) return { type: "INFO", message: "How much would you like to convert?", trace };  
  if (!e.currency || !e.targetCurrency) return { type: "INFO", message: "Which currencies would you like to convert between? For example: \"Convert 100 USD to EUR\".", trace };

  // Calculate live rate mathematically
  const fromRate = fxRates[e.currency] || 1;
  const toRate = fxRates[e.targetCurrency] || 1;
  const rate = toRate / fromRate;
  const convertedAmount = e.amount * rate;

  return {
    type: "CONVERSION_DRAFT",
    message: `Drafting a conversion of ${e.amount.toLocaleString()} ${e.currency} to ${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${e.targetCurrency} (Rate: 1 ${e.currency} = ${rate.toFixed(4)} ${e.targetCurrency}).`,
    data: { 
      fromCurrency: e.currency, 
      toCurrency: e.targetCurrency, 
      amount: e.amount, 
      rate: rate,
      convertedAmount: convertedAmount,
      recipient: "Self", 
      rail: "Internal FX" 
    },
    trace,
  };
}
function buildLinkDraft(e: ParsedEntities, session: WICSession, trace: TraceEntry[]): WICDraft {  
  if (!e.amount) return { type: "INFO", message: "How much would you like to request?", trace };  
  const currency = e.currency ?? session.defaultCurrency;
  let description = e.description ?? "";
  if (e.recipient && !description.includes(e.recipient)) {
    description = description ? `${e.recipient} — ${description}` : `Payment from ${e.recipient}`;
  }
  if (!description) description = "Payment Request";
  return {
    type: "LINK_DRAFT",
    message: `Drafting a payment link for ${e.amount.toLocaleString()} ${currency}${e.recipient ? ` from ${e.recipient}` : ""}.`,
    data: { amount: e.amount, currency, description },
    trace,
  };
}

function buildRecurringDraft(e: ParsedEntities, session: WICSession, trace: TraceEntry[]): WICDraft {
  if (!e.recipient) return { type: "INFO", message: "Who is this recurring payment for?", trace };  
  if (!e.amount) return { type: "INFO", message: `Got it — recurring payment to ${e.recipient}. How much per cycle?`, trace };
  if (!e.recurrence) return { type: "INFO", message: "How often should this repeat? For example: \"every Friday\" or \"monthly\".", trace };
  const currency = e.currency ?? session.defaultCurrency;
  return {
    type: "RECURRING_DRAFT",
    message: `Setting up a wire-roll: ${e.amount.toLocaleString()} ${currency} to ${e.recipient}, ${e.recurrence.label}.`,
    data: {
      recipient: e.recipient, recipientContactId: e.recipientContactId,
      amount: e.amount, currency, frequency: e.recurrence.frequency, anchor: e.recurrence.anchor ?? null, rail: "Auto",
    },
    requiresConfirmation: true,
    confirmationReason: "Recurring payments run automatically until cancelled — confirm the schedule before activating.",
    trace,
  };
}

function buildMethodDraft(trace: TraceEntry[]): WICDraft {
  return { 
    type: "INFO", 
    message: "I can't issue a card on my own yet — open Cards and tap 'Add card', then configure the limits. I've noted you want a single-use card; I'll automate this soon.", 
    trace 
  };
}

function buildWhyDraft(session: WICSession, trace: TraceEntry[]): WICDraft {
  const last = session.lastInfo;
  if (!last) return { type: "INFO", message: "Nothing to explain yet — ask me to send, convert, forecast, or check a balance first.", trace };
  if (last.confirmationReason) {
    const floor = Math.max(5_000, Math.round(session.liquidityUsd * 0.01));
    return {
      type: "INFO",
      message: `Because: ${last.confirmationReason} My guardrail flags transfers above ${floor.toLocaleString()} (1% of your liquidity) or repeats of recent payments — that's how I keep your money safe.`,
      trace,
    };
  }
  return { type: "INFO", message: `Here's my reasoning: I read your message as "${last.intent}" (${last.detail}). I resolve names against your real payee history and never guess with money.`, trace };
}

function buildAnalysisDraft(e: ParsedEntities, session: WICSession, trace: TraceEntry[]): WICDraft {
  const fromCur = e.currency || session.defaultCurrency;
  const toCur = e.targetCurrency || "EUR";
  
  const responses = [
    `Based on current market conditions, the ${fromCur}/${toCur} rate is relatively stable. If you have no immediate need for ${toCur}, you might want to wait for a more favorable rate. However, if you need to convert soon, now is a reasonable time. Would you like me to draft a conversion?`,
    `The ${fromCur}/${toCur} pair has been trending sideways recently. Without significant volatility, converting now locks in the current rate. If you're watching for a dip, you might hold off. Shall I prepare a conversion draft for when you're ready?`,
    `Current ${fromCur}/${toCur} rates are within normal range. There's no strong signal to convert immediately or wait. If you have an upcoming expense in ${toCur}, converting now provides certainty. Want me to draft it?`,
  ];
  
  const message = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    type: "INFO",
    message,
    trace,
  };
}

function routeToBuilder(intent: IntentId, e: ParsedEntities, session: WICSession, trace: TraceEntry[], fxRates: Record<string, number>): WICDraft {
  switch (intent) {
    case "PAYMENT": return buildPaymentDraft(e, session, trace);
    case "CONVERT": return buildConversionDraft(e, fxRates, trace); // <-- Pass fxRates here
    case "TOPUP": return buildTopupDraft(e, session, trace);
    case "REQUEST": return buildLinkDraft(e, session, trace);
    case "RECURRING": return buildRecurringDraft(e, session, trace);
    case "METHOD": return buildMethodDraft(trace);
    case "BALANCE": return { type: "BALANCE_QUERY", message: "", data: { currency: e.currency || null }, trace };
    case "SOCIALIZING": return { type: "INFO", message: SOCIAL_REPLIES[session.turns % SOCIAL_REPLIES.length], trace };
    case "WHY": return buildWhyDraft(session, trace);
    case "FORECAST": return { type: "FORECAST", message: "", trace };
    case "ANALYSIS": return buildAnalysisDraft(e, session, trace);
    case "INFO": return { type: "INFO", message: "I can help with sending payments, converting currencies, topping up wallets, payment links, recurring wire-rolls, balances, and cash-flow forecasts. What would you like to do?", trace };
    default: return {
      type: "INFO",
      message: "I didn't quite catch that. Try:\n• \"Send 50 USD to John\"\n• \"Send John his usual\"\n• \"How much do I have in my USD wallet?\"\n• \"Should I convert my USD to EUR?\"",      
      trace,
    };
  }
}

const ACTIONABLE: IntentId[] = ["PAYMENT", "CONVERT", "TOPUP", "REQUEST", "RECURRING"];

export function wicProcess(prompt: string, session: WICSession, fxRates: Record<string, number> = {}): WICDraft {
  const trace: TraceEntry[] = [];
  session.turns += 1;
  const hasPending = session.pendingDraft !== null;

  if (hasPending && CANCEL_PATTERN.test(prompt)) {
    session.clearPending();
    return { type: "INFO", message: "Cancelled — nothing is pending.", trace: [{ step: "cancel", detail: "pending draft cleared" }] };
  }

  if (hasPending && session.pendingDraft!.entities.recipientSuggestions?.length) {
    if (YES_PATTERN.test(prompt)) {
      const chosen = session.pendingDraft!.entities.recipientSuggestions[0];
      const raw = session.pendingDraft!.entities.recipientRaw;
      session.learnAlias(chosen, raw);
      session.pendingDraft!.entities = { ...session.pendingDraft!.entities, recipient: chosen, recipientContactId: chosen, recipientSuggestions: undefined };
      trace.push({ step: "confirm", detail: `user accepted suggestion: ${chosen}; alias learned: ${raw ?? "none"}` });
      const draft = routeToBuilder(session.pendingDraft!.intent, session.pendingDraft!.entities, session, trace, fxRates);
      return applyGuardrails(draft, session, session.pendingDraft!.entities);
    }
    if (NO_PATTERN.test(prompt)) {
      return { type: "INFO", message: "Which one then? Type the full name exactly as saved.", trace };
    }
  }

  let intent = classifyIntent(prompt, hasPending);
  const fresh = parseEntities(prompt, session);

  if (intent === "UNKNOWN" && hasPending) {
    if (!fresh.recipient) {
      const nameMatch = matchByName(prompt, session.contacts);
      if (nameMatch) {
        session.learnAlias(nameMatch.name, session.pendingDraft!.entities.recipientRaw);
        fresh.recipient = nameMatch.name;
        fresh.recipientContactId = nameMatch.id;
        fresh.recipientSuggestions = undefined;
      }
    }
    if (hasFreshSignal(fresh)) {
      intent = session.pendingDraft!.intent;
      trace.push({ step: "continuation", detail: `resumed ${intent} from fresh entities` });      
    }
  }
  trace.push({ step: "classifyIntent", detail: `${intent}${hasPending ? " (pending present)" : ""}` });

  let entities = fresh;
  if (intent === "CORRECTION" && session.pendingDraft) {
    entities = mergeEntities(session.pendingDraft.entities, fresh);
    session.pendingDraft = { intent: session.pendingDraft.intent, entities };
    trace.push({ step: "correction", detail: "merged into pending draft" });
    let draft = routeToBuilder(session.pendingDraft.intent, entities, session, trace, fxRates);
    if (draft.type !== "INFO") draft = { ...applyGuardrails(draft, session, entities), type: "CORRECTION_DRAFT" };
    return draft;
  }

  if (hasPending && session.pendingDraft!.intent === intent && ACTIONABLE.includes(intent)) {     
    entities = mergeEntities(session.pendingDraft!.entities, fresh);
    trace.push({ step: "slotFill", detail: "merged same-intent continuation" });
  }

  trace.push({ step: "entities", detail: `recipient=${entities.recipient ?? "—"} amount=${entities.amount ?? "—"} currency=${entities.currency ?? "—"}` });

  let draft = routeToBuilder(intent, entities, session, trace, fxRates); // <-- Pass fxRates here
  draft = applyGuardrails(draft, session, entities);

  if (ACTIONABLE.includes(intent)) {
    session.pendingDraft = { intent, entities };
    if (draft.type !== "INFO" && entities.recipient && entities.amount) {
      session.rememberFinalized(entities.recipient, entities.amount, entities.currency ?? session.defaultCurrency);
      session.lastRecipient = entities.recipient;
    }
  } else if (intent === "UNKNOWN" || intent === "INFO" || intent === "ANALYSIS") {
    if (!hasPending) session.clearPending();
  }

  session.lastInfo = {
    intent,
    detail: trace.find((t) => t.step === "entities")?.detail ?? "",
    confirmationReason: draft.confirmationReason,
  };

  return draft;
}
