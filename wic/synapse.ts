// ============================================================
// WIC Synapse — Multi-Provider LLM Orchestrator
// Location: wic/synapse.ts
// ============================================================

type Provider = "openrouter" | "groq";

export interface SynapseEntities {
  recipient: string | null;
  amount: number | null;
  currency: string | null;
  targetCurrency: string | null;
  frequency: string | null;
}

export interface SynapseResponse {
  intent: "PAYMENT" | "CONVERT" | "TOPUP" | "REQUEST" | "RECURRING" | "BALANCE" | "ANALYSIS" | "UNKNOWN";
  entities: SynapseEntities;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are WIC, the Wireways Intelligence Cloud. You are a precise, secure, and highly intelligent financial reasoning engine. 

CRITICAL SAFETY RULES:
1. NEVER hallucinate financial data. If the user does not explicitly state an amount or currency, you MUST set them to null and set needsClarification to true.
2. ALWAYS check the "Recent Conversation" in the context. If the user is providing a short follow-up (e.g., "500 USD"), merge it with the previous intent and entities from the conversation history.
3. Output MUST be valid JSON only. Do not wrap in markdown blocks. Do not add conversational text outside the JSON. If you cannot fulfill the request, return a valid JSON with "intent": "UNKNOWN" and "needsClarification": true.

JSON SCHEMA:
{
  "intent": "PAYMENT" | "CONVERT" | "TOPUP" | "REQUEST" | "RECURRING" | "BALANCE" | "ANALYSIS" | "UNKNOWN",
  "entities": {
    "recipient": string | null,
    "amount": number | null,
    "currency": string | null,
    "targetCurrency": string | null,
    "frequency": string | null
  },
  "needsClarification": boolean,
  "clarificationQuestion": string | null,
  "reasoning": string
}`;

async function queryOpenRouter(prompt: string): Promise<SynapseResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key missing");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Wireways WIC"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API failed: ${response.status} ${errText}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return parseJSONResponse(content);
}

async function queryGroq(prompt: string): Promise<SynapseResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // UPDATED: Using Groq's current, active standard free model
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API failed: ${response.status} ${errText}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return parseJSONResponse(content);
}

function parseJSONResponse(rawText: string | null | undefined): SynapseResponse {
  if (!rawText || rawText.trim() === "") {
    throw new Error("LLM returned empty or null content");
  }
  
  try {
    let cleaned = String(rawText).trim();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    } else {
      // Fallback: Find the first '{' and the last '}'
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }
    
    const parsed = JSON.parse(cleaned);
    if (!parsed.intent || !parsed.entities) throw new Error("Invalid schema");
    return parsed as SynapseResponse;
  } catch (e) {
    console.error("[Synapse] Failed to parse LLM JSON. Raw text:", rawText);
    throw new Error("LLM returned invalid JSON");
  }
}

export async function synapseReason(userPrompt: string, context?: string): Promise<SynapseResponse> {
  const fullPrompt = context ? `Context: ${context}\n\nUser: ${userPrompt}` : userPrompt;
  
  const providers: { name: Provider; fn: (p: string) => Promise<SynapseResponse> }[] = [
    { name: "openrouter", fn: queryOpenRouter },
    { name: "groq", fn: queryGroq },
  ];

  for (const provider of providers) {
    try {
      console.log(`[Synapse] Routing to ${provider.name}...`);
      const result = await provider.fn(fullPrompt);
      console.log(`[Synapse] Success via ${provider.name}`);
      return result;
    } catch (error: any) {
      console.warn(`[Synapse] ${provider.name} failed:`, error.message);
    }
  }

  console.error("[Synapse] All providers failed. Using deterministic fallback.");
  return {
    intent: "UNKNOWN",
    entities: { recipient: null, amount: null, currency: null, targetCurrency: null, frequency: null },
    needsClarification: true,
    clarificationQuestion: "I'm having trouble connecting to my reasoning engine. Could you rephrase that with specific details (e.g., amount, currency, recipient)?",
    reasoning: "All LLM providers failed; reverted to safe fallback."
  };
}