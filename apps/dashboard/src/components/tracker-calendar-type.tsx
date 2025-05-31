"use client";

import { setWeeklyCalendarAction } from "@/actions/set-weekly-calendar-action";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useAction } from "next-safe-action/hooks";

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
  const setWeeklyCalendar = useAction(setWeeklyCalendarAction);

  const handleChange = (value: string) => {
    setParams({ view: value as "week" | "month" });
    setWeeklyCalendar.execute(value === "week");
  };

  return (
    <Tabs className="h-[37px]" value={view} onValueChange={handleChange}>
      <TabsList className="p-0 h-[37px]">
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="!bg-transparent h-[37px]"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
