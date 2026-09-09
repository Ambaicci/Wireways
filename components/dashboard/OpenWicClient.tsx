"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Code2, Network, ShieldCheck, 
  DollarSign, Clock, Play, ChevronRight, Check, Terminal, Zap
} from "lucide-react";
import ApiKeys from "@/components/dashboard/settings/ApiKeys";

// Model Registry: This is what makes the gateway valuable. 
// The user picks a model, and the backend automatically routes to the correct provider.
const AVAILABLE_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", latency: "~400ms", price: "$0.005 / 1K tokens" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", latency: "~250ms", price: "$0.00015 / 1K tokens" },
  { id: "llama3-70b-8192", name: "Llama 3 70B", provider: "Groq", latency: "~150ms", price: "$0.00059 / 1K tokens" },
  { id: "llama3-8b-8192", name: "Llama 3 8B", provider: "Groq", latency: "~50ms", price: "$0.00005 / 1K tokens" },
];

export default function OpenWicClient() {
  const [activeLang, setActiveLang] = useState<"curl" | "node" | "python">("curl");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  
  // Live Playground States
  const [prompt, setPrompt] = useState("Analyze my Q3 liquidity runway and project cash flow.");
  const [rawResponse, setRawResponse] = useState("");
  const [renderedText, setRenderedText] = useState("");
  const [meta, setMeta] = useState({ latency: "—", provider: "—", cost: "—" });

  const handleRun = async () => {
    if (!prompt.trim()) return;
    
    setIsRunning(true);
    setShowOutput(false);
    setRawResponse("");
    setRenderedText("");

    try {
      // Call our real backend route
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk_live_demo_investor_key' 
        },
        body: JSON.stringify({
          model: selectedModel, // DYNAMIC MODEL SELECTION
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await res.json();
      
      // Extract the custom metadata headers injected by our backend
      const latency = res.headers.get('X-OpenWIC-Latency') || '0ms';
      const provider = res.headers.get('X-OpenWIC-Provider') || 'unknown';
      const cost = res.headers.get('X-OpenWIC-Cost') || '$0.00';

      setRawResponse(JSON.stringify(data, null, 2));
      setRenderedText(data.choices?.[0]?.message?.content || "No content returned.");
      setMeta({ latency, provider, cost });
      setShowOutput(true);
      
    } catch (error) {
      console.error("Playground Error:", error);
      setRenderedText("Error connecting to OpenWIC Gateway. Please check console.");
      setShowOutput(true);
    } finally {
      setIsRunning(false);
    }
  };

  const codeSnippets = {
    curl: `curl https://api.wireways.com/v1/chat/completions \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedModel}",
    "messages": [{"role": "user", "content": "Analyze my Q3 liquidity runway"}]
  }'`,
    node: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.wireways.com/v1",
  apiKey: "sk_live_...",
});

const completion = await openai.chat.completions.create({
  model: "${selectedModel}",
  messages: [{ role: "user", content: "Analyze my Q3 liquidity runway" }],
});

console.log(completion.choices[0].message);`,
    python: `from openai import OpenAI

client = OpenAI(
  base_url="https://api.wireways.com/v1",
  api_key="sk_live_...",
)

completion = client.chat.completions.create(
  model="${selectedModel}",
  messages=[{"role": "user", "content": "Analyze my Q3 liquidity runway"}]
)

print(completion.choices[0].message)`
  };

  return (
    <div className="min-h-screen bg-[#F6F5F3] text-[#1D1D1F]">
      
      {/* ─── DARK HERO SECTION ─── */}
      <section className="bg-[#1C1917] text-white pt-16 pb-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#F1622C] text-[11px] font-mono font-bold uppercase tracking-widest mb-6">
            Wireways · Developer Platform
          </div>
          <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-[1.1] mb-6">
            One API. Every AI Model.<br />
            <span className="text-[#F1622C]">Zero Complexity.</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            OpenWIC gives any developer direct access to hundreds of external AI models through a single, unified Wireways credential. Priced per call, tested live, with smart fallbacks.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 border-t border-white/10 pt-8 max-w-3xl mx-auto">
            {[
              { val: "500+", label: "Models Available" },
              { val: "99.97%", label: "Uptime SLA" },
              { val: "~120ms", label: "Avg Latency" },
              { val: "$0.003", label: "From, per 1K tokens" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[24px] md:text-[28px] font-mono font-bold text-white">{stat.val}</div>
                <div className="text-[10px] md:text-[11px] text-white/40 uppercase tracking-widest mt-1 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24">

        {/* ─── CAPABILITY CATALOG ─── */}
        <section>
          <div className="mb-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">The Gateway</p>
            <h2 className="text-[28px] font-extrabold tracking-tight">Enterprise-grade routing, not a black box.</h2>
            <p className="text-[#86868B] mt-3 text-[15px] max-w-2xl leading-relaxed">
              Every capability is a separate, individually-priced layer. Route intelligently, fallback automatically, and see exactly what each call costs.
            </p>
          </div>

          <div className="border border-[#E5E5EA] rounded-[16px] overflow-hidden bg-white shadow-sm">
            <div className="grid grid-cols-12 bg-[#FAFAFA] border-b border-[#E5E5EA] px-6 py-3">
              <span className="col-span-5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Capability</span>
              <span className="col-span-2 text-[10px] font-bold text-[#86868B] uppercase tracking-wider text-right">Latency</span>
              <span className="col-span-2 text-[10px] font-bold text-[#86868B] uppercase tracking-wider text-right">Status</span>
              <span className="col-span-3 text-[10px] font-bold text-[#86868B] uppercase tracking-wider text-right">Action</span>
            </div>
            {[
              { name: "Smart Routing", desc: "Automatic load balancing across 50+ providers", latency: "~45ms", icon: Network, color: "bg-[#F1622C]" },
              { name: "Model Fallbacks", desc: "Seamless failover if a primary provider times out", latency: "< 100ms", icon: ShieldCheck, color: "bg-[#4C5C88]" },
              { name: "Unified Billing", desc: "One wallet, one invoice for all external model usage", latency: "Real-time", icon: DollarSign, color: "bg-[#287A55]" },
              { name: "OpenAI Compatibility", desc: "Drop-in replacement for existing SDKs and libraries", latency: "Native", icon: Code2, color: "bg-[#9C6B08]" },
            ].map((cap, idx) => (
              <div key={cap.name} className={`grid grid-cols-12 items-center px-6 py-4 border-b border-[#E5E5EA] hover:bg-[#FAFAFA] transition-colors ${idx === 3 ? 'border-b-0' : ''}`}>
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${cap.color} flex items-center justify-center flex-shrink-0`}>
                    <cap.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-mono text-[13px] font-bold text-[#1D1D1F]">{cap.name}</div>
                    <div className="text-[12px] text-[#86868B] mt-0.5">{cap.desc}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono text-[13px] text-[#57534E]">{cap.latency}</div>
                <div className="col-span-2 flex justify-end">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#287A55]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#287A55]" /> Operational
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <button className="text-[12px] font-bold text-[#F1622C] hover:text-[#D4511E] flex items-center justify-end gap-1 ml-auto">
                    View Docs <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── INTERACTIVE PLAYGROUND ─── */}
        <section className="bg-[#1C1917] rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
          <div className="p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">Try before you integrate</p>
              <h2 className="text-[24px] font-extrabold text-white tracking-tight">The Playground.</h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white/5 border border-white/10 text-white text-[13px] font-semibold hover:bg-white/10 transition-colors">
              <BookOpen className="w-4 h-4" /> Read the Docs
            </button>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            {/* Language Tabs */}
            <div className="flex gap-1 border-b border-white/10 pb-0">
              {(["curl", "node", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeLang === lang ? "bg-[#1C1917] text-white border-b-2 border-[#F1622C]" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Code Snippet */}
            <div className="relative group">
              <pre className="bg-black/40 rounded-[12px] p-5 font-mono text-[13px] leading-relaxed text-[#E8E6E3] overflow-x-auto border border-white/5">
                <code>{codeSnippets[activeLang]}</code>
              </pre>
            </div>

            {/* Live Tester */}
            <div className="bg-black/20 rounded-[12px] border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-[#F1622C]" />
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Live Request Tester</span>
              </div>
              
              {/* MODEL SELECTOR DROPDOWN */}
              <div className="mb-4">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Select Model</label>
                <div className="relative">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-[8px] px-4 py-3 text-[14px] text-white outline-none focus:border-[#F1622C] transition-colors appearance-none cursor-pointer font-mono"
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#1C1917] text-white py-2">
                        {m.name} — {m.provider} ({m.latency})
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 rotate-90 pointer-events-none" />
                </div>
              </div>

              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full bg-black/40 border border-white/10 rounded-[8px] p-4 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-[#F1622C] transition-colors resize-none h-24 font-sans"
              />
              <div className="flex justify-end mt-4">
                <button 
                  onClick={handleRun}
                  disabled={isRunning || !prompt.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-[#F1622C] text-white text-[13px] font-bold hover:bg-[#D4511E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? <Clock className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                  {isRunning ? "Routing..." : "Run Request"}
                </button>
              </div>
            </div>

            {/* Real Output */}
            {showOutput && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <div className="bg-black/40 rounded-[12px] border border-white/5 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider bg-black/20">Raw JSON Response</div>
                  <pre className="p-4 font-mono text-[11px] text-[#9ECE6A] leading-relaxed overflow-auto max-h-[300px] flex-1">
                    {rawResponse}
                  </pre>
                </div>
                <div className="bg-black/40 rounded-[12px] border border-white/5 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider bg-black/20">Gateway Metadata</div>
                  <div className="p-4 space-y-3 font-mono text-[12px] text-white/70 flex-1">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Routed Provider:</span> 
                      <span className="text-white font-semibold flex items-center gap-2">
                        {meta.provider === 'groq' ? <Zap className="w-3 h-3 text-[#F1622C]" /> : <Code2 className="w-3 h-3 text-[#4C5C88]" />}
                        {meta.provider.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/40">Latency:</span> <span className="text-[#9ECE6A] font-semibold">{meta.latency}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/40">Cost:</span> <span className="text-[#9ECE6A] font-semibold">{meta.cost}</span></div>
                    <div className="pt-2">
                      <span className="text-white/40 block mb-2">Rendered Output:</span>
                      <p className="text-white/90 font-sans text-[13px] leading-relaxed whitespace-pre-wrap">{renderedText}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ─── API KEYS & WEBHOOKS ─── */}
        <section className="relative">
          <div className="absolute -top-20 right-0 w-96 h-96 bg-[#F1622C]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative">
            <div className="mb-8">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#F1622C] mb-2">Credentials</p>
              <h2 className="text-[28px] font-extrabold tracking-tight">API keys & webhooks.</h2>
            </div>
            <ApiKeys />
          </div>
        </section>

      </div>
    </div>
  );
}