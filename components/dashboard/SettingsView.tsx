"use client";
import { useEffect, useState } from "react";
import ApiKeys from "./settings/ApiKeys";
import WicIntelligence from "./settings/WicIntelligence";
import MoneyRisk from "./settings/MoneyRisk";
import Notifications from "./settings/Notifications";
import Profile from "./settings/Profile";
import Security from "./settings/Security";
import DataHistory from "./settings/DataHistory";
import LogoutSession from "./settings/LogoutSession";
import DangerZone from "./settings/DangerZone";

interface Props { user: { name: string; email: string; company: string }; }

const DEFAULTS: Record<string, any> = {
  wic_autonomy: "advise", wic_memory_on: 1, wic_show_reasoning: 1,
  privacy_default: 0, reporting_currency: "USD", liquidity_target_days: 14,
  fx_alert_threshold_pct: 2.0, notify_funding_gaps: 1,
  notify_fx_opportunities: 1, notify_weekly_briefing: 1,
  timezone: "UTC", default_wallet: "USD", account_type: "business",
};

export default function SettingsView({ user }: Props) {
  // Shared settings state — the one thing every panel needs to agree on
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULTS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await fetch("/api/wic/settings").then((r) => r.json());
      if (s.success) setSettings({ ...DEFAULTS, ...s.settings });
      setSettingsLoaded(true);
    })();
  }, []);

  const patchSetting = async (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavingSettings(true);
    await fetch("/api/wic/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSavingSettings(false);
  };

  return (
    <div className="max-w-[820px] mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#312B1E]">Settings</h1>
        <p className="text-[13px] text-[#8D8476] mt-1">The control room — your business, your intelligence, your rules.</p>
      </div>

      {/* 01 · API & services — business-first */}
      <ApiKeys />

      {/* 02 · WIC intelligence */}
      <WicIntelligence settings={settings} settingsLoaded={settingsLoaded} savingSettings={savingSettings} patchSetting={patchSetting} />

      {/* 03 · Money & risk */}
      <MoneyRisk settings={settings} patchSetting={patchSetting} />

      {/* 04 · Notifications */}
      <Notifications settings={settings} patchSetting={patchSetting} />

      {/* 05 · Workspace profile */}
      <Profile user={user} settings={settings} patchSetting={patchSetting} />

      {/* 06 · Security */}
      <Security />

      {/* 07 · Data & history */}
      <DataHistory settings={settings} />

      {/* 08 · Session */}
      <LogoutSession email={user.email} />

      {/* 09 · Danger zone — always last */}
      <DangerZone patchSetting={patchSetting} />
    </div>
  );
}