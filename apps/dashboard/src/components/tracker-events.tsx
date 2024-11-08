"use client";

import { secondsToHoursAndMinutes } from "@/utils/format";
import { cn } from "@midday/ui/cn";

export function TrackerEvents({
  data,
  isToday,
}: { data: TrackerEvent[]; isToday: boolean }) {
  return (
    <div className="flex flex-col space-y-2 font-sans w-full">
      {data && data.length > 0 && (
        <div
          className={cn(
            "text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-1 w-full text-left line-clamp-1 min-h-[23px]",
            isToday && "!bg-background",
          )}
          key={data[0].id}
        >
          {data[0].project.name} ({secondsToHoursAndMinutes(data[0].duration)})
        </div>
      )}
      {data && data.length > 1 && (
        <div className="text-xs text-primary p-1 w-full text-left">
          +{data.length - 1} more
        </div>
      )}
    </div>
  );
}
