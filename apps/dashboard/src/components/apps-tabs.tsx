"use client";

import { cn } from "@midday/ui/cn";
import { useQueryState } from "nuqs";

const tabs = [
  {
    name: "All",
    value: "all",
  },
  {
    name: "Installed",
    value: "installed",
  },
];

export function AppsTabs() {
  const [currentTab, setTab] = useQueryState("tab", {
    shallow: false,
    defaultValue: "all",
  });

  return (
    <div className="flex">
      {tabs.map((tab) => (
        <button
          onClick={() => setTab(tab.value)}
          key={tab.value}
          type="button"
          className={cn(
            "text-sm transition-colors bg-[#1D1D1D] text-[#878787] px-4",
            currentTab === tab.value && "text-primary bg-[#2C2C2C]",
          )}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
