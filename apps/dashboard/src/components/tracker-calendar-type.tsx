"use client";

import { setWeeklyCalendarAction } from "@/actions/set-weekly-calendar-action";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef } from "react";

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
  const hasMounted = useRef(false);

  // Update cookie as a side effect when view changes (but not on initial mount)
  useEffect(() => {
    if (hasMounted.current) {
      setWeeklyCalendar.execute(view === "week");
    } else {
      hasMounted.current = true;
    }
  }, [view, setWeeklyCalendar]);

  return (
    <Tabs
      className="h-[37px]"
      value={view}
      onValueChange={(value) => {
        setParams({ view: value as "week" | "month" });
      }}
    >
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
