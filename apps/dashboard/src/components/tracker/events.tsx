"use client";
import { useUserQuery } from "@/hooks/use-user";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createSafeDate } from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";

type Props = {
  data:
    | RouterOutputs["trackerEntries"]["byRange"]["result"][string]
    | undefined;
  isToday: boolean;
  allData?: RouterOutputs["trackerEntries"]["byRange"]["result"];
  currentDate: TZDate;
  onEventClick?: (eventId: string, date: TZDate) => void;
};

export function TrackerEvents({
  data,
  isToday,
  allData,
  currentDate,
  onEventClick,
}: Props) {
  const { data: user } = useUserQuery();

  // Process entries to handle midnight spanning - EXACTLY like weekly calendar
  const processedEntries = (() => {
    // currentDate is already a TZDate in user timezone (like weekly calendar)
    const currentDayStr = format(currentDate, "yyyy-MM-dd");
    const userTimezone = user?.timezone || "UTC";
    const allEntries = [];

    // FIRST LOOP: Process current day data (exactly like weekly calendar)
    const currentDayData = allData?.[currentDayStr] || [];

    for (const event of currentDayData) {
      const startDate = createSafeDate(event.start);
      const endDate = createSafeDate(event.stop);

      // Check if this entry spans midnight - EXACT same logic as weekly calendar
      let startDateStr: string;
      let endDateStr: string;

      if (userTimezone !== "UTC") {
        try {
          const startInUserTz = new TZDate(startDate, userTimezone);
          const endInUserTz = new TZDate(endDate, userTimezone);
          startDateStr = format(startInUserTz, "yyyy-MM-dd");
          endDateStr = format(endInUserTz, "yyyy-MM-dd");
        } catch {
          // Fallback to UTC if timezone conversion fails
          startDateStr = format(startDate, "yyyy-MM-dd");
          endDateStr = format(endDate, "yyyy-MM-dd");
        }
      } else {
        startDateStr = format(startDate, "yyyy-MM-dd");
        endDateStr = format(endDate, "yyyy-MM-dd");
      }

      const spansMidnight = startDateStr !== endDateStr;

      // Always show entries stored under the current date
      if (event.date === currentDayStr) {
        // This entry was created on this date - show it as the primary display
        allEntries.push({
          ...event,
          isFirstPart: spansMidnight, // Show arrow if spans midnight
          isContinuation: false,
          originalDuration: event.duration,
          sortKey: `${event.date}-${event.start}`,
        });
      } else if (spansMidnight && endDateStr === currentDayStr) {
        // This is a continuation from a previous day
        // Show the continuation part (from midnight to end time)
        allEntries.push({
          ...event,
          isFirstPart: false,
          isContinuation: true,
          originalDuration: event.duration,
          sortKey: `${event.date}-${event.start}`,
        });
      }
      // If entry doesn't belong to this day, skip it (same as weekly calendar)
    }

    // SECOND LOOP: Check previous day for entries that continue into current day (exactly like weekly calendar)
    // Simple previous day calculation using the date string directly (same as weekly)
    const parts = currentDayStr.split("-").map(Number);
    const year = parts[0]!;
    const month = parts[1]!;
    const dayNum = parts[2]!;
    const previousDateObj = new Date(year, month - 1, dayNum - 1); // month is 0-indexed in JS Date
    const previousDayStr = format(previousDateObj, "yyyy-MM-dd");

    const previousDayData =
      (allData && previousDayStr && allData[previousDayStr]) || [];

    for (const event of previousDayData) {
      const startDate = createSafeDate(event.start);
      const endDate = createSafeDate(event.stop);

      // Convert to user timezone to check if it spans midnight in their local time
      let startDateStr: string;
      let endDateStr: string;

      if (userTimezone !== "UTC") {
        try {
          const startInUserTz = new TZDate(startDate, userTimezone);
          const endInUserTz = new TZDate(endDate, userTimezone);

          startDateStr = format(startInUserTz, "yyyy-MM-dd");
          endDateStr = format(endInUserTz, "yyyy-MM-dd");
        } catch {
          // Fallback to UTC if timezone conversion fails
          startDateStr = format(startDate, "yyyy-MM-dd");
          endDateStr = format(endDate, "yyyy-MM-dd");
        }
      } else {
        startDateStr = format(startDate, "yyyy-MM-dd");
        endDateStr = format(endDate, "yyyy-MM-dd");
      }

      const spansMidnight = startDateStr !== endDateStr;

      // If this entry from previous day ends on current day
      if (spansMidnight && endDateStr === currentDayStr) {
        allEntries.push({
          ...event,
          isFirstPart: false,
          isContinuation: true,
          originalDuration: event.duration,
          sortKey: `${event.date}-${event.start}`,
        });
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
                (entry.isContinuation || onEventClick) && "cursor-pointer", // Show cursor for continuation events or when event click is enabled
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
