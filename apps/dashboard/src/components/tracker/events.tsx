"use client";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createSafeDate } from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import type { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";

type Props = {
  data:
    | RouterOutputs["trackerEntries"]["byRange"]["result"][string]
    | undefined;
  isToday: boolean;
  allData?: RouterOutputs["trackerEntries"]["byRange"]["result"];
  currentDate: Date;
  currentTZDate?: TZDate;
  hasContinuationEvents?: boolean;
};

export function TrackerEvents({
  data,
  isToday,
  allData,
  currentDate,
  currentTZDate,
  hasContinuationEvents,
}: Props) {
  // Process entries to handle midnight spanning
  const processedEntries = (() => {
    const currentDayStr = format(currentDate, "yyyy-MM-dd");
    const allEntries = [];

    // Add entries for current day
    if (data) {
      for (const event of data) {
        const startDate = createSafeDate(event.start);
        const endDate = createSafeDate(event.stop);

        // Check if this entry spans midnight by comparing actual dates
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        const spansMidnight = startDateStr !== endDateStr;

        if (spansMidnight) {
          if (startDateStr === currentDayStr) {
            // This is the first part of the entry (ends at midnight)
            // Calculate duration from start time to midnight
            const endOfDay = new Date(startDate);
            endOfDay.setHours(23, 59, 59, 999);
            const firstPartDuration =
              Math.floor((endOfDay.getTime() - startDate.getTime()) / 1000) + 1;

            allEntries.push({
              ...event,
              duration: firstPartDuration,
              isFirstPart: true,
              isContinuation: false,
              originalDuration: event.duration,
              sortKey: `${startDateStr}-${event.start}`, // For sorting
            });
          }
        } else {
          // Normal entry that doesn't span midnight
          allEntries.push({
            ...event,
            isFirstPart: false,
            isContinuation: false,
            originalDuration: event.duration,
            sortKey: `${startDateStr}-${event.start}`, // For sorting
          });
        }
      }
    }

    // Check previous day for entries that continue into current day
    if (allData) {
      const previousDay = new Date(currentDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousDayStr = format(previousDay, "yyyy-MM-dd");
      const previousDayData = allData[previousDayStr] || [];

      for (const event of previousDayData) {
        const startDate = createSafeDate(event.start);
        const endDate = createSafeDate(event.stop);
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        const spansMidnight = startDateStr !== endDateStr;

        // If this entry from previous day ends on current day
        if (spansMidnight && endDateStr === currentDayStr) {
          // Calculate duration from start of day to end time
          const startOfDay = new Date(endDate);
          startOfDay.setHours(0, 0, 0, 0);
          const secondPartDuration = Math.floor(
            (endDate.getTime() - startOfDay.getTime()) / 1000,
          );

          allEntries.push({
            ...event,
            duration: secondPartDuration,
            isFirstPart: false,
            isContinuation: true,
            originalDuration: event.duration,
            sortKey: `${previousDayStr}-${event.start}`, // For sorting
          });
        }
      }
    }

    // Sort entries by original start time to maintain chronological order
    return allEntries.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  })();

  if (!processedEntries.length) return null;

  return (
    <div className="flex flex-col space-y-2 font-sans w-full">
      {processedEntries.map((entry, index) => {
        if (index === 0) {
          // Show the first event (chronologically)
          return (
            <div
              key={entry.id}
              className={cn(
                "text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-1 w-full text-left line-clamp-1 min-h-[23px]",
                entry.isContinuation && "cursor-pointer", // Only show cursor for continuation events
                isToday && "!bg-background",
              )}
              data-is-continuation={entry.isContinuation}
              data-event-id={entry.id}
            >
              {entry.trackerProject?.name || "No Project"}
              {entry.isFirstPart && " →"}
              {entry.isContinuation && " ←"}
              {" ("}
              {secondsToHoursAndMinutes(entry.duration ?? 0)}
              {")"}
            </div>
          );
        }
        return null;
      })}
      {processedEntries.length > 1 && (
        <div
          className="text-xs text-primary p-1 w-full text-left cursor-pointer"
          data-show-all-events="true"
        >
          +{processedEntries.length - 1} more
        </div>
      )}
    </div>
  );
}
