"use client";

import { useUserQuery } from "@/hooks/use-user";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createSafeDate, formatHour, getSlotFromDate } from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";

type CalendarWeekViewProps = {
  weekDays: TZDate[];
  currentDate: TZDate;
  selectedDate: string | null;
  data: RouterOutputs["trackerEntries"]["byRange"]["result"] | undefined;
  range: [string, string] | null;
  localRange: [string | null, string | null];
  isDragging: boolean;
  weekStartsOnMonday: boolean;
  handleMouseDown: (date: TZDate) => void;
  handleMouseEnter: (date: TZDate) => void;
  handleMouseUp: () => void;
  onEventClick?: (eventId: string, date: TZDate) => void;
};

const SLOT_HEIGHT = 6.5;
const HOUR_HEIGHT = 26; // Fill the available height (600px - header) / 24 hours ≈ 26px
const hours = Array.from({ length: 25 }, (_, i) => i); // 0-24 for cleaner display

type ProcessedEntry = {
  event: NonNullable<
    RouterOutputs["trackerEntries"]["byRange"]["result"]
  >[string][number];
  eventIndex: string | number;
  displayStartSlot: number;
  displayEndSlot: number;
  isContinuation: boolean;
  spansMidnight: boolean;
  isFromCurrentDay: boolean;
};

export function CalendarWeekView({
  weekDays,
  currentDate,
  data,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
  onEventClick,
}: CalendarWeekViewProps) {
  const { data: user } = useUserQuery();
  const is24Hour = user?.timeFormat === 24;

  const renderDayEntries = (day: TZDate) => {
    const currentDayStr = format(day, "yyyy-MM-dd");
    const dayData = data?.[currentDayStr] || [];
    const allEntries: ProcessedEntry[] = [];

    // Add entries for current day
    dayData.forEach((event, eventIndex) => {
      const startDate = createSafeDate(event.start);
      const endDate = createSafeDate(event.stop);

      // Convert UTC times to user timezone for display slot calculation
      const displayTimezone = user?.timezone || "UTC";
      let startSlot: number;
      let originalEndSlot: number;

      if (displayTimezone !== "UTC") {
        try {
          const startInUserTz = new TZDate(startDate, displayTimezone);
          const endInUserTz = new TZDate(endDate, displayTimezone);
          startSlot = getSlotFromDate(startInUserTz);
          originalEndSlot = getSlotFromDate(endInUserTz);
        } catch {
          // Fallback to UTC if timezone conversion fails
          startSlot = getSlotFromDate(startDate);
          originalEndSlot = getSlotFromDate(endDate);
        }
      } else {
        startSlot = getSlotFromDate(startDate);
        originalEndSlot = getSlotFromDate(endDate);
      }

      // Check if this entry spans midnight by comparing actual dates in user timezone
      let startDateStr: string;
      let endDateStr: string;

      if (displayTimezone !== "UTC") {
        try {
          // Convert UTC times to user timezone for proper midnight detection
          const startInUserTz = new TZDate(startDate, displayTimezone);
          const endInUserTz = new TZDate(endDate, displayTimezone);

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

      const displayStartSlot = startSlot;
      let displayEndSlot = originalEndSlot;
      const isContinuation = false;

      if (spansMidnight) {
        if (startDateStr === currentDayStr) {
          // This is the first part of the entry (ends at midnight)
          displayEndSlot = 96; // End of day
        } else {
          // Skip entries that don't belong to this day
          return;
        }
      } else if (originalEndSlot < startSlot) {
        // Fallback for entries that cross midnight but are on the same date
        displayEndSlot = 96;
      }

      allEntries.push({
        event,
        eventIndex,
        displayStartSlot,
        displayEndSlot,
        isContinuation,
        spansMidnight,
        isFromCurrentDay: true,
      });
    });

    // Check previous day for entries that continue into current day
    const currentDayDate = new Date(day);
    const previousDay = new Date(
      currentDayDate.getTime() - 24 * 60 * 60 * 1000,
    );
    const previousDayStr = previousDay.toISOString().split("T")[0]; // Extract YYYY-MM-DD from ISO string

    const previousDayData =
      (data && previousDayStr && data[previousDayStr]) || [];

    previousDayData.forEach((event, eventIndex) => {
      const startDate = createSafeDate(event.start);
      const endDate = createSafeDate(event.stop);

      // Convert to user timezone to check if it spans midnight in their local time
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

      // If this entry from previous day ends on current day
      if (spansMidnight && endDateStr === currentDayStr) {
        // Convert UTC to user timezone for continuation slot calculation
        let originalEndSlot: number;
        if (userTimezone !== "UTC") {
          try {
            const endInUserTz = new TZDate(endDate, userTimezone);
            originalEndSlot = getSlotFromDate(endInUserTz);
          } catch {
            originalEndSlot = getSlotFromDate(endDate);
          }
        } else {
          originalEndSlot = getSlotFromDate(endDate);
        }

        allEntries.push({
          event,
          eventIndex: `prev-${eventIndex}`,
          displayStartSlot: 0, // Start of day
          displayEndSlot: originalEndSlot,
          isContinuation: true,
          spansMidnight,
          isFromCurrentDay: false,
        });
      }
    });

    return allEntries.map((entry) => {
      const top = entry.displayStartSlot * SLOT_HEIGHT;
      const height = Math.max(
        (entry.displayEndSlot - entry.displayStartSlot) * SLOT_HEIGHT,
        20,
      );

      const handleEventClick = () => {
        if (entry.isContinuation) {
          // If this is a continuation entry, select the previous day (original day)
          // Don't select the event for split events, just navigate to the day
          const previousDay = new Date(day);
          previousDay.setDate(previousDay.getDate() - 1);
          const previousDayTZ = new TZDate(previousDay, "UTC");
          handleMouseDown(previousDayTZ);
        } else {
          // Normal event click behavior - select the event if we have onEventClick
          if (onEventClick) {
            onEventClick(entry.event.id, day);
          } else {
            // Fallback to just selecting the day
            handleMouseDown(day);
          }
        }
      };

      return (
        <div
          key={`${entry.event.id}-${entry.eventIndex}`}
          className="absolute left-0 right-0 text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-2 z-10 overflow-hidden cursor-pointer hover:bg-[#E8E8E8] dark:hover:bg-[#252525] transition-colors"
          style={{
            top: `${top}px`,
            height: `${height}px`,
          }}
          onMouseDown={handleEventClick}
          onMouseEnter={() => {
            if (entry.spansMidnight) {
              const allParts = document.querySelectorAll(
                `[data-event-id="${entry.event.id}"]`,
              );
              for (const part of allParts) {
                part.classList.add("!bg-[#E8E8E8]", "dark:!bg-[#252525]");
              }
            }
            handleMouseEnter(day);
          }}
          onMouseLeave={() => {
            if (entry.spansMidnight) {
              const allParts = document.querySelectorAll(
                `[data-event-id="${entry.event.id}"]`,
              );
              for (const part of allParts) {
                part.classList.remove("!bg-[#E8E8E8]", "dark:!bg-[#252525]");
              }
            }
          }}
          onMouseUp={handleMouseUp}
          data-event-id={entry.event.id}
        >
          <div className="font-medium truncate leading-tight">
            {entry.event.trackerProject?.name || "No Project"}
            {entry.spansMidnight && entry.isFromCurrentDay && " →"}
            {entry.isContinuation && " ←"}
          </div>
          {height > 24 && (
            <div className="truncate">
              (
              {secondsToHoursAndMinutes(
                (entry.displayEndSlot - entry.displayStartSlot) * 15 * 60, // 15 minutes per slot
              )}
              )
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col border border-border border-b-0">
      <div
        className="grid gap-px bg-border border-b border-border"
        style={{
          gridTemplateColumns: is24Hour
            ? "55px repeat(7, 1fr)"
            : "80px repeat(7, 1fr)",
        }}
      >
        {/* Empty space above time column */}
        <div className="py-4 px-2 bg-background" />

        {/* Day headers - name and date on same row */}
        {weekDays.map((day) => (
          <div
            key={`header-${day.toString()}`}
            className="py-4 px-2 bg-background text-xs font-medium text-[#878787] font-mono text-center"
          >
            <div className="flex flex-row items-end justify-center gap-2">
              <span className="uppercase">{format(day, "EEE")}</span>
              <span className="text-foreground font-medium">
                {format(day, "d")}
              </span>
              {day.getMonth() !== currentDate.getMonth() && (
                <span className="text-[[10px] text-[#878787] uppercase">
                  {format(day, "MMM")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid and events */}
      <div
        className="grid gap-px bg-border flex-1"
        style={{
          gridTemplateColumns: is24Hour
            ? "55px repeat(7, 1fr)"
            : "80px repeat(7, 1fr)",
        }}
      >
        {/* Time labels column */}
        <div className="bg-background">
          {hours.slice(0, -1).map(
            (
              hour, // Remove the last hour (24) to avoid duplication
            ) => (
              <div
                key={hour}
                className="flex items-center justify-center text-[12px] text-[#878787] font-mono border-b border-border"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hour < 24 && formatHour(hour, user?.timeFormat)}
              </div>
            ),
          )}
        </div>

        {/* Days columns */}
        {weekDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");

          return (
            <div key={dayKey} className="relative bg-background">
              {/* Hour grid lines */}
              {hours.slice(0, -1).map((hour) => {
                return (
                  <div
                    key={`${dayKey}-${hour}`}
                    className={cn(
                      "hover:bg-muted/10 transition-colors cursor-pointer border-b border-border relative group",
                    )}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onMouseDown={() => handleMouseDown(day)}
                    onMouseEnter={() => handleMouseEnter(day)}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Hour hover indicator */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 pointer-events-none" />

                    {/* Time indicator on hover */}
                    <div className="absolute left-1 top-0.5 text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none bg-background/80 px-1 rounded">
                      {formatHour(hour, user?.timeFormat)}
                    </div>
                  </div>
                );
              })}

              {/* Events for this day */}
              {renderDayEntries(day)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
