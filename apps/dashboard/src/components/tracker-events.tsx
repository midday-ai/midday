"use client";

import { secondsToHoursAndMinutes } from "@/utils/format";

export function TrackerEvents({ data }: { data: TrackerEvent[] }) {
  return (
    <div className="flex flex-col space-y-2 font-sans w-full">
      {data && data.length > 0 && (
        <div
          className="text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-1 w-full text-left"
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
