"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Copy, Check, KeyRound, RefreshCw, Loader2, Trash2, Webhook, AlertTriangle } from "lucide-react";
import { getApiKeys, regenerateApiKeys, getWebhooks, createWebhook, deleteWebhook } from "@/lib/actions";

const ACCENT = "#F1622C";

const WEBHOOK_EVENTS = [
  { key: "payment.completed", label: "Payment completed" },
  { key: "payment.failed", label: "Payment failed" },
  { key: "wallet.topup", label: "Wallet top-up" },
  { key: "conversion.completed", label: "Conversion completed" },
  { key: "wire_roll.executed", label: "Wire-roll executed" },
];

interface WebhookRow {
  id: number; url: string; events: string[]; secret: string; isActive: boolean; createdAt: string;
}

export default function ApiKeys() {
  // ── API keys state ──
  const [keys, setKeys] = useState<{ publishableKey: string; secretKey: string } | null>(null);
  const [keysLoaded, setKeysLoaded] = useState(false);
  
  // CRITICAL: Only allow revealing if the key was JUST generated in this session
  const [justGenerated, setJustGenerated] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // ── Webhooks state ──
  const [webhooks, setWebhooks] = useState<WebhookRow[] | null>(null);
  const [webhooksLoaded, setWebhooksLoaded] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["payment.completed", "payment.failed", "wallet.topup"]);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [revealingSecret, setRevealingSecret] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const k = await getApiKeys();
      if (k.success && k.keys) {
        setKeys(k.keys);
        // If the backend returns a masked key (contains '•'), we know it's not a fresh generation
        setJustGenerated(!k.keys.secretKey.includes("•"));
      }
      setKeysLoaded(true);

      const w = await getWebhooks();
      if (w.success && w.webhooks) setWebhooks(w.webhooks);
      else setWebhooks([]);
      setWebhooksLoaded(true);
    })();
  }, []);

  const handleGenerateKeys = async () => {
    if (!confirm("⚠️ WARNING: Regenerating your secret key will immediately invalidate the old one. Any applications using the old key will stop working. Continue?")) {
      return;
    }
    
    setGenerating(true);
    const res = await regenerateApiKeys();
    setGenerating(false);
    
    if (res.success && res.keys) { 
      setKeys(res.keys); 
      setJustGenerated(true); // CRITICAL: Flag that we can show it this one time
      setShowSecret(true); 
    }
  };

  const handleCopy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleWebhookEvent = (key: string) => {
    setWebhookEvents((prev) => prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]);
  };

  const handleAddWebhook = async () => {
    if (!webhookUrl.trim()) return;
    setCreatingWebhook(true);
    const res = await createWebhook({ url: webhookUrl.trim(), events: webhookEvents });
    setCreatingWebhook(false);
    if (res.success && res.webhook) {
      setWebhooks((prev) => [res.webhook!, ...(prev || [])]);
      setWebhookUrl("");
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm("Delete this webhook? It will stop receiving events immediately.")) return;
    await deleteWebhook(id);
    setWebhooks((prev) => (prev || []).filter((w) => w.id !== id));
  };

  return (
    <section className="bg-white border border-[#E5E5EA] rounded-[24px] p-6 md:p-8 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${ACCENT}08` }} />
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F1622C]/10 border border-[#F1622C]/20">
            <KeyRound className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight">API & Services</h2>
            <p className="text-[12px] text-[#86868B] font-medium mt-0.5">Developer keys, webhooks, and integrations.</p>
          </div>
        </div>
        {keys && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F2EC] border border-[#287A55]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#287A55]" />
            <span className="text-[10px] font-bold text-[#287A55] uppercase tracking-wider">Live Keys</span>
          </span>
        )}
      </div>

      <div className="relative space-y-4">
        {!keysLoaded ? (
          <div className="h-[120px] rounded-[16px] bg-[#F5F5F7] border border-[#E5E5EA] animate-pulse" />
        ) : !keys ? (
          <div className="rounded-[16px] border border-[#E5E5EA] bg-[#F5F5F7] p-6 text-center">
            <p className="text-[14px] text-[#4B5563] leading-relaxed">No API keys yet. Generate your credentials to integrate Wireways into your own applications.</p>
            <button onClick={handleGenerateKeys} disabled={generating}
              className="mt-4 inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-[12px] text-[14px] font-semibold hover:bg-[#D4511E] transition-all disabled:opacity-60 shadow-sm" style={{ background: ACCENT }}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Generate API Keys
            </button>
          </div>
        ) : (
          <>
            {/* Publishable Key */}
            <div className="rounded-[16px] border border-[#E5E5EA] bg-[#F5F5F7] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Publishable Key</span>
                <button onClick={() => handleCopy(keys.publishableKey, "Publishable key")} className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                  {copied === "Publishable key" ? <Check className="w-3.5 h-3.5 text-[#287A55]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "Publishable key" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="font-mono text-[13px] text-[#1D1D1F] break-all bg-white p-3 rounded-[10px] border border-[#E5E5EA]">{keys.publishableKey}</div>
            </div>

            {/* Secret Key */}
            <div className="rounded-[16px] border p-4" style={{ borderColor: `${ACCENT}30`, backgroundColor: `${ACCENT}05` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Secret Key</span>
                <div className="flex items-center gap-3">
                  {/* CRITICAL: Only show Reveal button if just generated */}
                  {justGenerated && (
                    <button onClick={() => setShowSecret(!showSecret)} className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showSecret ? "Hide" : "Reveal"}
                    </button>
                  )}
                  <button onClick={() => handleCopy(keys.secretKey, "Secret key")} className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                    {copied === "Secret key" ? <Check className="w-3.5 h-3.5 text-[#287A55]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "Secret key" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="font-mono text-[13px] text-[#1D1D1F] break-all bg-white p-3 rounded-[10px] border border-[#E5E5EA]">
                {showSecret ? keys.secretKey : (keys.secretKey.includes("•") ? keys.secretKey : `sk_live_${"•".repeat(48)}`)}
              </div>
              
              {/* CRITICAL: Warning banner if the key is permanently hidden */}
              {!justGenerated && keys.secretKey.includes("•") && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-[10px] bg-[#FEE2E2] border border-[#DC2626]/20">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#991B1B] leading-relaxed">
                    For your security, the secret key is only shown once. If you have lost it, you must regenerate a new key below. The old key will be immediately invalidated.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[12px] text-[#86868B] leading-relaxed">Your secret key carries full account privileges. Never expose it in client-side code or public repositories.</p>
              <button onClick={handleGenerateKeys} disabled={generating}
                className="shrink-0 flex items-center gap-2 border border-[#E5E5EA] bg-white text-[#1D1D1F] px-4 py-2 rounded-[10px] text-[13px] font-semibold hover:bg-[#F5F5F7] hover:border-[#D1D1D6] transition-all disabled:opacity-60">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Regenerate
              </button>
            </div>
          </>
        )}
      </div>

      {/* Webhooks */}
      <div className="relative border-t border-[#E5E5EA] mt-8 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="w-4 h-4" style={{ color: ACCENT }} />
          <h3 className="text-[15px] font-bold text-[#1D1D1F]">Webhooks</h3>
          <span className="text-[12px] text-[#86868B] font-medium">— receive live events in your own systems</span>
        </div>

        <div className="rounded-[16px] border border-[#E5E5EA] bg-[#F5F5F7] p-4 space-y-4">
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-app.com/api/webhooks/wireways"
            className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-4 py-2.5 text-[13px] font-mono text-[#1D1D1F] outline-none focus:border-[#F1622C] focus:ring-2 focus:ring-[#F1622C]/10 transition-all placeholder:text-[#A1A1AA]"
          />
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((ev) => (
              <button key={ev.key} onClick={() => toggleWebhookEvent(ev.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${webhookEvents.includes(ev.key) ? "border-[#F1622C]/40 bg-[#F1622C]/10 text-[#F1622C]" : "border-[#E5E5EA] bg-white text-[#86868B] hover:border-[#D1D1D6] hover:text-[#1D1D1F]"}`}>
                {ev.label}
              </button>
            ))}
          </div>
          <button onClick={handleAddWebhook} disabled={creatingWebhook || !webhookUrl.trim()}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-[10px] text-[13px] font-semibold hover:bg-[#D4511E] transition-all disabled:opacity-50 shadow-sm" style={{ background: ACCENT }}>
            {creatingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Webhook className="w-3.5 h-3.5" />}
            Add Webhook
          </button>
        </div>

        {!webhooksLoaded ? (
          <div className="h-[60px] rounded-[16px] bg-[#F5F5F7] border border-[#E5E5EA] animate-pulse mt-4" />
        ) : webhooks && webhooks.length > 0 ? (
          <div className="space-y-3 mt-4">
            {webhooks.map((w) => (
              <div key={w.id} className="rounded-[16px] border border-[#E5E5EA] bg-white p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="font-mono text-[13px] text-[#1D1D1F] break-all">{w.url}</div>
                  <button onClick={() => handleDeleteWebhook(w.id)} className="shrink-0 text-[#86868B] hover:text-[#DC2626] transition-colors p-1 hover:bg-[#FEE2E2] rounded-md" title="Delete webhook">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {w.events.map((ev: string) => (
                    <span key={ev} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F5F7] border border-[#E5E5EA] text-[#6B7280]">{ev}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5E5EA]">
                  <div className="font-mono text-[11px] text-[#86868B] break-all bg-[#F5F5F7] px-2 py-1 rounded">
                    {revealingSecret === w.id ? w.secret : `${w.secret.slice(0, 12)}${"•".repeat(24)}`}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setRevealingSecret(revealingSecret === w.id ? null : w.id)} className="text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                      {revealingSecret === w.id ? "Hide" : "Reveal"}
                    </button>
                    <button onClick={() => handleCopy(w.secret, `webhook-${w.id}`)} className="text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors flex items-center gap-1">
                      {copied === `webhook-${w.id}` ? <Check className="w-3.5 h-3.5 text-[#287A55]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === `webhook-${w.id}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#86868B] mt-4">No webhooks yet. Add one above to receive payment events in real time.</p>
        )}
      </div>
    </section>
  );
}