"use client";
import { Brain } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  settingsLoaded: boolean;
  savingSettings: boolean;
  patchSetting: (key: string, value: any) => void;
}

const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

export default function WicIntelligence({ settings, settingsLoaded, savingSettings, patchSetting }: Props) {
  return (
    <section className="relative bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)] overflow-hidden">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: "#F1622C15" }} />
      <div className="relative flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-[10px]" style={{ backgroundColor: "#F1622C22" }}><Brain className="w-4 h-4" style={{ color: "#F1622C" }} /></div>
        <div>
          <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">WIC intelligence</h2>
          <p className="text-[11px] text-[#8D8476]">Tune how much WIC advises, drafts, or acts.</p>
        </div>
        {savingSettings && <span className="ml-auto text-[10px] font-bold text-[#8D8476] uppercase tracking-[0.1em]">Saving…</span>}
      </div>

      {!settingsLoaded ? (
        <div className="h-[200px] rounded-[14px] bg-[#F5EFE6] animate-pulse" />
      ) : (
        <div className="relative space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Autonomy level</label>
              <span className="text-[11px] font-bold text-[#312B1E]">
                {settings.wic_autonomy === "auto" ? "Auto-run" : settings.wic_autonomy === "draft" ? "Draft & confirm" : "Advise only"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-[12px] border border-[#E8E0D4] bg-[#FFFBF6] p-1">
              {[
                { v: "advise", label: "Advise", desc: "WIC shows recommendations; you decide" },
                { v: "draft", label: "Draft", desc: "WIC fills forms; you confirm" },
                { v: "auto", label: "Auto-run", desc: "WIC executes within guardrails" },
              ].map((o) => (
                <button key={o.v} onClick={() => patchSetting("wic_autonomy", o.v)} title={o.desc}
                  className={`py-2.5 px-2 rounded-[10px] text-[11.5px] font-bold transition-all ${settings.wic_autonomy === o.v ? "bg-[#312B1E] text-white shadow-sm" : "text-[#6E665A] hover:text-[#312B1E]"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: "wic_memory_on", label: "WIC memory", desc: "Remember patterns from your payment history (cadences, corridors, counterparties)." },
            { key: "wic_show_reasoning", label: "Always show reasoning", desc: "Expand WIC's confidence factors on the dashboard by default." },
          ].map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4">
              <div>
                <div className="text-[13px] font-bold text-[#312B1E]">{t.label}</div>
                <p className="text-[11.5px] text-[#8D8476] mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              <button onClick={() => patchSetting(t.key, settings[t.key] ? 0 : 1)}
                className={`shrink-0 rounded-full relative transition-colors ${settings[t.key] ? "bg-[#287A55]" : "bg-[#E8E0D4]"}`}
                style={{ width: 40, height: 22 }}>
                <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all ${settings[t.key] ? "left-[20px]" : "left-[2px]"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}