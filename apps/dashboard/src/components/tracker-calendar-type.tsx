"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";

const options = [
  {
    value: "week",
    label: "Week",
  },
  {
    value: "month",
    label: "Month",
  },
] as const;

export function TrackerCalendarType() {
  const { view, setParams } = useTrackerParams();

  return (
    <Tabs
      defaultValue="month"
      className="h-[38px]"
      value={view}
      onValueChange={(value) => setParams({ view: value as "week" | "month" })}
    >
      <TabsList className="p-0 h-[38px]">
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="!bg-transparent h-[38px]"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
