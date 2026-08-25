"use client";
import { Bell } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  patchSetting: (key: string, value: any) => void;
}

export default function Notifications({ settings, patchSetting }: Props) {
  return (
    <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-[10px] bg-[#FFF0E7]"><Bell className="w-4 h-4" style={{ color: "#F1622C" }} /></div>
        <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">Notifications</h2>
      </div>
      <div className="space-y-2.5">
        {[
          { key: "notify_funding_gaps", label: "Funding gaps", desc: "Alert me when a wire-roll runs short." },
          { key: "notify_fx_opportunities", label: "FX opportunities", desc: "Alert me when a favorable rate appears." },
          { key: "notify_weekly_briefing", label: "Weekly WIC briefing", desc: "A Monday-morning summary of the week ahead." },
        ].map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4 rounded-[12px] border border-[#E8E0D4] bg-[#FFFBF6] p-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#312B1E]">{t.label}</div>
              <p className="text-[11.5px] text-[#8D8476] mt-0.5">{t.desc}</p>
            </div>
            <button onClick={() => patchSetting(t.key, settings[t.key] ? 0 : 1)}
              className={`shrink-0 rounded-full relative transition-colors ${settings[t.key] ? "bg-[#287A55]" : "bg-[#E8E0D4]"}`}
              style={{ width: 40, height: 22 }}>
              <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all ${settings[t.key] ? "left-[20px]" : "left-[2px]"}`} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}