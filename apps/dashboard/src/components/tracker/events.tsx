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
  currentDate: Date;
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

  // Process entries to handle midnight spanning
  const processedEntries = (() => {
    const currentDayStr = format(currentDate, "yyyy-MM-dd");
    const allEntries = [];

    // Process all available entries to find those that belong to the current day
    if (allData) {
      // Iterate through all days' entries to find ones that belong to or continue onto the current day
      for (const dayEntries of Object.values(allData)) {
        if (!dayEntries) continue;

        for (const event of dayEntries) {
          const startDate = createSafeDate(event.start);
          const endDate = createSafeDate(event.stop);

          // Check if this entry spans midnight by comparing actual dates in user timezone
          const userTimezone = user?.timezone || "UTC";
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

          // Always show entries stored under the current date (like weekly view does)
          if (event.date === currentDayStr) {
            // This entry was created on this date - show it as the primary display
            if (spansMidnight) {
              // For midnight-spanning entries, show first part with arrow
              const userTimezone = user?.timezone || "UTC";
              let endOfDay: Date;

              if (userTimezone !== "UTC") {
                try {
                  // Create end of day in user's timezone
                  const endOfDayInUserTz = new TZDate(startDate, userTimezone);
                  endOfDayInUserTz.setHours(23, 59, 59, 999);
                  endOfDay = endOfDayInUserTz;
                } catch {
                  // Fallback to UTC if timezone conversion fails
                  const endOfDayUTC = new Date(startDate);
                  endOfDayUTC.setHours(23, 59, 59, 999);
                  endOfDay = endOfDayUTC;
                }
              } else {
                const endOfDayUTC = new Date(startDate);
                endOfDayUTC.setHours(23, 59, 59, 999);
                endOfDay = endOfDayUTC;
              }

              const firstPartDuration = Math.floor(
                (endOfDay.getTime() - startDate.getTime()) / 1000,
              );

              allEntries.push({
                ...event,
                duration: firstPartDuration,
                isFirstPart: true,
                isContinuation: false,
                originalDuration: event.duration,
                sortKey: `${event.date}-${event.start}`, // Use event.date for sorting
              });
            } else {
              // Normal entry that doesn't span midnight
              allEntries.push({
                ...event,
                isFirstPart: false,
                isContinuation: false,
                originalDuration: event.duration,
                sortKey: `${event.date}-${event.start}`, // Use event.date for sorting
              });
            }
          } else if (spansMidnight && endDateStr === currentDayStr) {
            // This is a continuation from a previous day (entry.date != currentDayStr but ends today)
            // Calculate duration from start of day to end time in user's timezone
            const userTimezone = user?.timezone || "UTC";
            let startOfDay: Date;

            if (userTimezone !== "UTC") {
              try {
                // Create start of day in user's timezone
                const startOfDayInUserTz = new TZDate(endDate, userTimezone);
                startOfDayInUserTz.setHours(0, 0, 0, 0);
                startOfDay = startOfDayInUserTz;
              } catch {
                // Fallback to UTC if timezone conversion fails
                const startOfDayUTC = new Date(endDate);
                startOfDayUTC.setHours(0, 0, 0, 0);
                startOfDay = startOfDayUTC;
              }
            } else {
              const startOfDayUTC = new Date(endDate);
              startOfDayUTC.setHours(0, 0, 0, 0);
              startOfDay = startOfDayUTC;
            }

            const secondPartDuration = Math.floor(
              (endDate.getTime() - startOfDay.getTime()) / 1000,
            );

            allEntries.push({
              ...event,
              duration: secondPartDuration,
              isFirstPart: false,
              isContinuation: true,
              originalDuration: event.duration,
              sortKey: `${event.date}-${event.start}`, // Use event.date for sorting
            });
          }
          // If entry doesn't belong to this day (entry.date != currentDayStr and doesn't end today), skip it
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
