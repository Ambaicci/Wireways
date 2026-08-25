"use client";
import { Sliders } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "USDC"];

interface Props {
  settings: Record<string, any>;
  patchSetting: (key: string, value: any) => void;
}

const inputCls = "mt-1.5 w-full border border-[#E8E0D4] rounded-[12px] px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 transition-all bg-white text-[#312B1E]";
const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

export default function MoneyRisk({ settings, patchSetting }: Props) {
  return (
    <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-[10px] bg-[#F1EADF]"><Sliders className="w-4 h-4 text-[#6E5B3E]" /></div>
        <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">Money & risk</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Reporting currency</label>
            <select value={settings.reporting_currency} onChange={(e) => patchSetting("reporting_currency", e.target.value)} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Default wallet</label>
            <select value={settings.default_wallet} onChange={(e) => patchSetting("default_wallet", e.target.value)} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <p className="text-[11px] text-[#8D8476] mt-1">The wallet WIC draws from first when covering gaps.</p>
          </div>
          <div>
            <label className={labelCls}>Liquidity runway target (days)</label>
            <input type="number" min="3" max="90" value={settings.liquidity_target_days}
              onChange={(e) => patchSetting("liquidity_target_days", Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>FX alert threshold</label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="number" min="0.5" max="20" step="0.5" value={settings.fx_alert_threshold_pct}
                onChange={(e) => patchSetting("fx_alert_threshold_pct", Number(e.target.value))}
                className="flex-1 border border-[#E8E0D4] rounded-[12px] px-3.5 py-3 text-[14px] outline-none focus:border-[#F1622C]/60 focus:ring-4 focus:ring-[#F1622C]/10 bg-white text-[#312B1E]" />
              <span className="text-[14px] font-bold text-[#8D8476]">%</span>
            </div>
            <p className="text-[11px] text-[#8D8476] mt-1">Alert when today's rate is this far from your average.</p>
          </div>
        </div>
        <div>
          <label className={labelCls}>Privacy default</label>
          <button onClick={() => patchSetting("privacy_default", settings.privacy_default ? 0 : 1)}
            className="mt-1.5 w-full flex items-center justify-between rounded-[12px] border border-[#E8E0D4] bg-white px-3.5 py-3 transition-colors">
            <span className="text-[14px] text-[#312B1E]">Mask balances on load</span>
            <span className={`rounded-full relative transition-colors ${settings.privacy_default ? "bg-[#287A55]" : "bg-[#E8E0D4]"}`} style={{ width: 36, height: 20 }}>
              <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${settings.privacy_default ? "left-[18px]" : "left-[2px]"}`} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}