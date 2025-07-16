"use client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { isCrossDayEntry } from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";

type Props = {
  data:
    | RouterOutputs["trackerEntries"]["byRange"]["result"][string]
    | undefined;
  isToday: boolean;
  currentDate: string;
};

// Helper function to check if entry continues from previous day
function continuesFromPreviousDay(entry: any, currentDate: string): boolean {
  if (!isCrossDayEntry(entry)) return false;

  const entryStartDate = new Date(entry.start);
  const entryEndDate = new Date(entry.stop);

  const startDay = format(entryStartDate, "yyyy-MM-dd");
  const endDay = format(entryEndDate, "yyyy-MM-dd");

  // If this is a cross-day entry and the current date is the end date,
  // then it continues from the previous day
  return currentDate === endDay && startDay !== endDay;
}

// Helper function to check if entry continues to next day
function continuesToNextDay(entry: any, currentDate: string): boolean {
  if (!isCrossDayEntry(entry)) return false;

  const entryStartDate = new Date(entry.start);
  const entryEndDate = new Date(entry.stop);

  const startDay = format(entryStartDate, "yyyy-MM-dd");
  const endDay = format(entryEndDate, "yyyy-MM-dd");

  // If this is a cross-day entry and the current date is the start date,
  // then it continues to the next day
  return currentDate === startDay && startDay !== endDay;
}

export function TrackerEvents({ data, isToday, currentDate }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col space-y-1 font-sans w-full">
      {data.map((entry, index) => {
        // Check continuation status for each entry
        const isFromPrevious = continuesFromPreviousDay(entry, currentDate);
        const isToNext = continuesToNextDay(entry, currentDate);
        const isCrossDay = isCrossDayEntry(entry);

        return (
          <div
            key={`${entry.id}-${index}`}
            className={cn(
              "text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-1 w-full text-left line-clamp-1 min-h-[23px] relative",
              isToday && "!bg-background",
              isCrossDay && "border-l-2 border-l-primary/50",
            )}
          >
            <div className="flex items-center gap-1">
              {isFromPrevious && (
                <span
                  className="text-primary text-xs font-bold"
                  title="Continues from previous day"
                >
                  ←
                </span>
              )}
              <span className="truncate">
                {entry.trackerProject?.name} (
                {secondsToHoursAndMinutes(entry.duration ?? 0)})
              </span>
              {isToNext && (
                <span
                  className="text-primary text-xs font-bold"
                  title="Continues to next day"
                >
                  →
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
