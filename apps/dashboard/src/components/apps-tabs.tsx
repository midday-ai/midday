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
            "text-sm transition-colors px-4",
            "dark:bg-[#1D1D1D] dark:text-[#878787]",
            "bg-white text-gray-600",
            currentTab === tab.value &&
              "text-primary dark:bg-[#2C2C2C] bg-gray-100",
          )}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
