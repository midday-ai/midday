"use client";

import { cn } from "@midday/ui/cn";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useAction } from "next-safe-action/hooks";
import { setWeeklyCalendarAction } from "@/actions/set-weekly-calendar-action";
import { useTrackerParams } from "@/hooks/use-tracker-params";

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

type Props = {
  selectedView: "week" | "month";
};

export function TrackerCalendarType({ selectedView }: Props) {
  const { setParams } = useTrackerParams();
  const setWeeklyCalendar = useAction(setWeeklyCalendarAction);

  const handleChange = (value: string) => {
    setParams({ view: value as "week" | "month" });
    setWeeklyCalendar.execute(value === "week");
  };

  return (
    <Tabs
      value={selectedView}
      onValueChange={handleChange}
      className="h-[36px]"
    >
      <div className="relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] w-fit">
        <TabsList className="flex items-stretch h-auto p-0 bg-transparent h-[36px]">
          {options.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className={cn(
                "group relative flex items-center gap-1.5 px-2 py-1.5 text-[14px] transition-all whitespace-nowrap border border-transparent h-[36px] min-h-[36px]",
                "text-[#707070] hover:text-black bg-[#f7f7f7] dark:text-[#666666] dark:hover:text-white dark:bg-[#131313] mb-0 relative z-[1]",
                "data-[state=active]:text-black data-[state=active]:bg-[#e6e6e6] dark:data-[state=active]:text-white dark:data-[state=active]:bg-[#1d1d1d] data-[state=active]:mb-[-1px] data-[state=active]:z-10",
              )}
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
