"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Copy, Check, KeyRound, RefreshCw, Loader2, Trash2, Webhook } from "lucide-react";
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
      if (k.success && k.keys) setKeys(k.keys);
      setKeysLoaded(true);

      const w = await getWebhooks();
      if (w.success && w.webhooks) setWebhooks(w.webhooks);
      else setWebhooks([]);
      setWebhooksLoaded(true);
    })();
  }, []);

  const handleGenerateKeys = async () => {
    setGenerating(true);
    const res = await regenerateApiKeys();
    setGenerating(false);
    if (res.success && res.keys) { setKeys(res.keys); setShowSecret(true); }
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
    await deleteWebhook(id);
    setWebhooks((prev) => (prev || []).filter((w) => w.id !== id));
  };

  return (
    <section className="bg-[#0E1116] border border-[#2A2F3A] rounded-[20px] p-7 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${ACCENT}25` }} />
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[10px] border" style={{ backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}55` }}><KeyRound className="w-4 h-4" style={{ color: ACCENT }} /></div>
          <div>
            <h2 className="text-[16px] font-semibold text-white tracking-tight">API & services</h2>
            <p className="text-[11px] text-[#8791B3] font-mono">DEVELOPER KEYS · WEBHOOKS · INTEGRATIONS</p>
          </div>
        </div>
        {keys && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#287A55]" />
            <span className="text-[10px] font-bold text-[#287A55] tracking-wider">LIVE KEYS</span>
          </span>
        )}
      </div>

      <div className="relative space-y-4">
        {!keysLoaded ? (
          <div className="h-[120px] rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
        ) : !keys ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-[13px] text-[#A0AABF] leading-relaxed">No API keys yet. Generate your credentials to integrate Wireways into your own applications.</p>
            <button onClick={handleGenerateKeys} disabled={generating}
              className="mt-4 inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-[13.5px] font-semibold hover:brightness-110 transition-all disabled:opacity-60" style={{ background: ACCENT }}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Generate API keys
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#8791B3] tracking-wider uppercase">Publishable key</span>
                <button onClick={() => handleCopy(keys.publishableKey, "Publishable key")} className="flex items-center gap-1 text-[11px] font-mono text-[#8791B3] hover:text-white">
                  {copied === "Publishable key" ? <Check className="w-3 h-3 text-[#287A55]" /> : <Copy className="w-3 h-3" />}
                  {copied === "Publishable key" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="font-mono text-[13px] text-white break-all">{keys.publishableKey}</div>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: `${ACCENT}55`, backgroundColor: `${ACCENT}0A` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: ACCENT }}>Secret key</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowSecret(!showSecret)} className="flex items-center gap-1 text-[11px] font-mono text-[#8791B3] hover:text-white">
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSecret ? "Hide" : "Reveal"}
                  </button>
                  <button onClick={() => handleCopy(keys.secretKey, "Secret key")} className="flex items-center gap-1 text-[11px] font-mono text-[#8791B3] hover:text-white">
                    {copied === "Secret key" ? <Check className="w-3 h-3 text-[#287A55]" /> : <Copy className="w-3 h-3" />}
                    {copied === "Secret key" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="font-mono text-[13px] text-white break-all">
                {showSecret ? keys.secretKey : `sk_live_${"•".repeat(48)}`}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-[#8791B3] leading-relaxed">Your secret key carries full account privileges. Never expose it in client-side code.</p>
              <button onClick={handleGenerateKeys} disabled={generating}
                className="shrink-0 flex items-center gap-2 border border-white/15 text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:border-[#F1622C] hover:text-[#F1622C] transition-all disabled:opacity-60">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Regenerate
              </button>
            </div>
          </>
        )}
      </div>

      {/* Webhooks */}
      <div className="relative border-t border-white/10 mt-6 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Webhook className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <h3 className="text-[13px] font-semibold text-white">Webhooks</h3>
          <span className="text-[10px] text-[#8791B3]">— receive live events in your own systems</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-app.com/api/webhooks/wireways"
            className="w-full bg-[#0E1116] border border-white/10 rounded-[10px] px-3.5 py-2.5 text-[13px] font-mono text-white outline-none focus:border-[#F1622C]/60 transition-colors placeholder:text-[#4A5268]"
          />
          <div className="flex flex-wrap gap-1.5">
            {WEBHOOK_EVENTS.map((ev) => (
              <button key={ev.key} onClick={() => toggleWebhookEvent(ev.key)}
                className={`px-2.5 py-1.5 rounded-full text-[10.5px] font-mono border transition-all ${webhookEvents.includes(ev.key) ? "border-[#F1622C]/60 bg-[#F1622C]/15 text-[#FFB16E]" : "border-white/10 text-[#8791B3] hover:border-white/25"}`}>
                {ev.label}
              </button>
            ))}
          </div>
          <button onClick={handleAddWebhook} disabled={creatingWebhook || !webhookUrl.trim()}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-[10px] text-[12px] font-semibold hover:brightness-110 transition-all disabled:opacity-50" style={{ background: ACCENT }}>
            {creatingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Webhook className="w-3.5 h-3.5" />}
            Add webhook
          </button>
        </div>

        {!webhooksLoaded ? (
          <div className="h-[60px] rounded-xl bg-white/[0.03] border border-white/5 animate-pulse mt-3" />
        ) : webhooks && webhooks.length > 0 ? (
          <div className="space-y-2 mt-3">
            {webhooks.map((w) => (
              <div key={w.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-[12px] text-white break-all">{w.url}</div>
                  <button onClick={() => handleDeleteWebhook(w.id)} className="shrink-0 text-[#8791B3] hover:text-[#E5484D] transition-colors" title="Delete webhook">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {w.events.map((ev: string) => (
                    <span key={ev} className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-white/5 border border-white/10 text-[#8791B3]">{ev}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 mt-2.5 pt-2.5 border-t border-white/5">
                  <div className="font-mono text-[11px] text-[#8791B3] break-all">
                    {revealingSecret === w.id ? w.secret : `${w.secret.slice(0, 12)}${"•".repeat(24)}`}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setRevealingSecret(revealingSecret === w.id ? null : w.id)} className="text-[10px] font-mono text-[#8791B3] hover:text-white transition-colors">
                      {revealingSecret === w.id ? "Hide" : "Reveal"}
                    </button>
                    <button onClick={() => handleCopy(w.secret, `webhook-${w.id}`)} className="text-[10px] font-mono text-[#8791B3] hover:text-white transition-colors flex items-center gap-1">
                      {copied === `webhook-${w.id}` ? <Check className="w-3 h-3 text-[#287A55]" /> : <Copy className="w-3 h-3" />}
                      {copied === `webhook-${w.id}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#8791B3] mt-3">No webhooks yet. Add one above to receive payment events in real time.</p>
        )}
      </div>
    </section>
  );
}