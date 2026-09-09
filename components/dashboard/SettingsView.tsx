"use client";

import { useEffect, useState } from "react";
import { 
  BrainCircuit, ShieldCheck, Bell, User, 
  Database, LogOut, AlertTriangle, Key 
} from "lucide-react";
import ApiKeys from "./settings/ApiKeys";
import WicIntelligence from "./settings/WicIntelligence";
import MoneyRisk from "./settings/MoneyRisk";
import Notifications from "./settings/Notifications";
import Profile from "./settings/Profile";
import Security from "./settings/Security";
import DataHistory from "./settings/DataHistory";
import LogoutSession from "./settings/LogoutSession";
import DangerZone from "./settings/DangerZone";

interface Props { 
  user: { name: string; email: string; company: string; accountType: string }; 
}

const DEFAULTS: Record<string, any> = {
  wic_autonomy: "advise", wic_memory_on: 1, wic_show_reasoning: 1,
  privacy_default: 0, reporting_currency: "USD", liquidity_target_days: 14,
  fx_alert_threshold_pct: 2.0, notify_funding_gaps: 1,
  notify_fx_opportunities: 1, notify_weekly_briefing: 1,
  timezone: "UTC", default_wallet: "USD", account_type: "business",
};

export default function SettingsView({ user }: Props) {
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULTS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch("/api/wic/settings").then((r) => r.json());
        if (s.success) setSettings({ ...DEFAULTS, ...s.settings });
      } catch (e) {
        console.warn("Failed to load settings", e);
      } finally {
        setSettingsLoaded(true);
      }
    })();
  }, []);

  const patchSetting = async (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavingSettings(true);
    try {
      await fetch("/api/wic/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (e) {
      console.error("Failed to save setting", e);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#0F172A]">Settings</h1>
          <p className="text-[14px] text-[#64748B] mt-1.5">The control room. Configure your workspace, intelligence, and security.</p>
        </div>
        {savingSettings && (
          <span className="text-[12px] font-medium text-[#64748B] flex items-center gap-2 bg-[#F1F5F9] px-3 py-1.5 rounded-full border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            Saving changes...
          </span>
        )}
      </div>

      {/* WIC Presence / Intelligence Summary */}
      <div className="bg-[#0F172A] rounded-[20px] p-6 text-white relative overflow-hidden border border-[#1E293B]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
            {/* TODO: Replace with custom WIC Cloud SVG */}
            <BrainCircuit className="w-6 h-6 text-[#60A5FA]" />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold tracking-tight mb-1">WIC Control</h3>
            <p className="text-[13px] text-slate-300 leading-relaxed max-w-2xl">
              WIC is currently operating in <span className="text-white font-medium">"{settings.wic_autonomy === 'advise' ? 'Advise' : 'Autonomous'}"</span> mode. 
              It is actively monitoring your {settings.reporting_currency} liquidity and will alert you to funding gaps or FX opportunities based on your thresholds.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Group 1: Identity & Access */}
        <Section title="Identity & Access" icon={<User className="w-5 h-5" />}>
          <Profile user={user} settings={settings} patchSetting={patchSetting} />
        </Section>

        {/* Group 2: Intelligence & Automation */}
        <Section title="Intelligence & Automation" icon={<BrainCircuit className="w-5 h-5" />}>
          <WicIntelligence settings={settings} settingsLoaded={settingsLoaded} savingSettings={savingSettings} patchSetting={patchSetting} />
        </Section>

        {/* Group 3: Financial Controls */}
        <Section title="Financial Controls" icon={<ShieldCheck className="w-5 h-5" />}>
          <MoneyRisk settings={settings} patchSetting={patchSetting} />
        </Section>

        {/* Group 4: Integrations */}
        <Section title="Integrations" icon={<Key className="w-5 h-5" />}>
          <ApiKeys />
        </Section>

        {/* Group 5: Notifications */}
        <Section title="Notifications" icon={<Bell className="w-5 h-5" />}>
          <Notifications settings={settings} patchSetting={patchSetting} />
        </Section>

        {/* Group 6: Data & Security */}
        <Section title="Data & Security" icon={<Database className="w-5 h-5" />}>
          <div className="space-y-6">
            <Security />
            <DataHistory settings={settings} />
            <LogoutSession email={user.email} />
          </div>
        </Section>

        {/* Group 7: Danger Zone */}
        <Section title="Danger Zone" icon={<AlertTriangle className="w-5 h-5 text-[#EF4444]" />} isDanger>
          <DangerZone patchSetting={patchSetting} />
        </Section>
      </div>
    </div>
  );
}

// ─── Helper Component for Consistent Section Styling ──────
function Section({ 
  title, 
  icon, 
  children, 
  isDanger = false 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  isDanger?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-[20px] overflow-hidden shadow-sm transition-colors ${
      isDanger ? "border-[#FEE2E2]" : "border-[#E2E8F0]"
    }`}>
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${
        isDanger ? "border-[#FEE2E2] bg-[#FEF2F2]" : "border-[#F1F5F9] bg-[#F8FAFC]"
      }`}>
        <div className={`p-2 rounded-lg ${isDanger ? "bg-[#FEE2E2] text-[#EF4444]" : "bg-white border border-[#E2E8F0] text-[#475569]"}`}>
          {icon}
        </div>
        <h2 className={`text-[16px] font-semibold tracking-tight ${isDanger ? "text-[#991B1B]" : "text-[#0F172A]"}`}>
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}