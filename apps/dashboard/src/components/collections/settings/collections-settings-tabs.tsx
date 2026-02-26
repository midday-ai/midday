"use client";

import { cn } from "@midday/ui/cn";
import { useState } from "react";
import { StagesSettings } from "./stages-settings";
import { AgenciesSettings } from "./agencies-settings";
import { EscalationRulesSettings } from "./escalation-rules-settings";
import { SlaSettings } from "./sla-settings";

const TABS = [
  { key: "stages", label: "Stages" },
  { key: "agencies", label: "Agencies" },
  { key: "rules", label: "Escalation Rules" },
  { key: "sla", label: "SLA Thresholds" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function CollectionsSettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("stages");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium">Collections Configuration</h2>
        <p className="text-[12px] text-[#606060] mt-1">
          Configure your collections workflow stages, external agencies,
          auto-escalation rules, and SLA thresholds.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-[#878787] hover:text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "stages" && <StagesSettings />}
      {activeTab === "agencies" && <AgenciesSettings />}
      {activeTab === "rules" && <EscalationRulesSettings />}
      {activeTab === "sla" && <SlaSettings />}
    </div>
  );
}
