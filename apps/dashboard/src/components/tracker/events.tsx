"use client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";

type Props = {
  data:
    | RouterOutputs["trackerEntries"]["byRange"]["result"][string]
    | undefined;
  isToday: boolean;
};

export function TrackerEvents({ data, isToday }: Props) {
  return (
    <div className="flex flex-col space-y-2 font-sans w-full">
      {data && data.length > 0 && (
        <div
          className={cn(
            "text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-1 w-full text-left line-clamp-1 min-h-[23px]",
            isToday && "!bg-background",
          )}
          key={data?.at(0)?.id}
        >
          {data?.at(0)?.trackerProject?.name} (
          {secondsToHoursAndMinutes(data?.at(0)?.duration ?? 0)})
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
