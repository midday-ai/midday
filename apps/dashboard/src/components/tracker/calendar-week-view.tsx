"use client";

import { useUserQuery } from "@/hooks/use-user";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createSafeDate, formatHour, getSlotFromDate } from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { memo, useEffect, useMemo, useState } from "react";

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

// Optimized: Memoize hours array to prevent recreation
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

type PositionedEntry = ProcessedEntry & {
  column: number;
  totalColumns: number;
  width: number;
  left: number;
  leftPx?: number; // For pixel-based left positioning in cascading layout
};

/**
 * Detect if two events overlap in time
 */
const eventsOverlap = (
  event1: ProcessedEntry,
  event2: ProcessedEntry,
): boolean => {
  return (
    event1.displayStartSlot < event2.displayEndSlot &&
    event2.displayStartSlot < event1.displayEndSlot
  );
};

/**
 * Group overlapping events and calculate positioning
 * Optimized: Memoized and optimized for performance
 */
const calculateEventPositions = (
  entries: ProcessedEntry[],
): PositionedEntry[] => {
  if (entries.length === 0) return [];

  // Sort events by start time, then by duration (longer events first)
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.displayStartSlot !== b.displayStartSlot) {
      return a.displayStartSlot - b.displayStartSlot;
    }
    // If start times are the same, put longer events first
    return (
      b.displayEndSlot -
      b.displayStartSlot -
      (a.displayEndSlot - a.displayStartSlot)
    );
  });

  // Build overlap groups using a more robust algorithm
  const overlapGroups: ProcessedEntry[][] = [];
  const processed = new Set<ProcessedEntry>();

  for (const entry of sortedEntries) {
    if (processed.has(entry)) continue;

    // Start a new group with this entry
    const currentGroup: ProcessedEntry[] = [entry];
    processed.add(entry);

    // Keep expanding the group until no more overlaps are found
    let foundNewOverlap = true;
    while (foundNewOverlap) {
      foundNewOverlap = false;

      for (const candidate of sortedEntries) {
        if (processed.has(candidate)) continue;

        // Check if this candidate overlaps with ANY event in the current group
        const overlapsWithGroup = currentGroup.some((groupEntry) =>
          eventsOverlap(candidate, groupEntry),
        );

        if (overlapsWithGroup) {
          currentGroup.push(candidate);
          processed.add(candidate);
          foundNewOverlap = true;
          // Don't break here - keep checking other candidates in this iteration
        }
      }
    }

    overlapGroups.push(currentGroup);
  }

  const positionedEntries: PositionedEntry[] = [];

  // Process each overlap group separately
  for (const group of overlapGroups) {
    if (group.length === 1) {
      // Single event - no overlap, use full width
      const entry = group[0];
      if (entry) {
        positionedEntries.push({
          ...entry,
          column: 0,
          totalColumns: 1,
          width: 100,
          left: 0,
        });
      }
    } else {
      // Multiple overlapping events - use cascading/staggered layout

      // Sort group by start time for proper stacking order
      const sortedGroup = [...group].sort((a, b) => {
        if (a.displayStartSlot !== b.displayStartSlot) {
          return a.displayStartSlot - b.displayStartSlot;
        }
        return (
          b.displayEndSlot -
          b.displayStartSlot -
          (a.displayEndSlot - a.displayStartSlot)
        );
      });

      sortedGroup.forEach((entry, index) => {
        // Cascading layout parameters
        const offsetStep = 8; // Pixels to offset each event
        const baseWidth = 80; // Width for overlapping events (not the base)
        const widthReduction = 3; // How much to reduce width for each subsequent event

        // Calculate cascading properties
        const totalEvents = sortedGroup.length;

        // First event (index 0) gets full width, others get progressively smaller
        const width =
          index === 0
            ? 100
            : Math.max(60, baseWidth - (index - 1) * widthReduction);

        // Each event is offset to the right (except the first one)
        const leftOffset = index * offsetStep;
        const left = leftOffset;

        positionedEntries.push({
          ...entry,
          column: index,
          totalColumns: totalEvents,
          width,
          left,
          // Add a custom property for pixel-based left positioning
          leftPx: leftOffset,
        });
      });
    }
  }

  return positionedEntries;
};

// Optimized: Create memoized component for day entries to prevent unnecessary re-renders
const DayEntries = memo(
  ({
    day,
    data,
    user,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    onEventClick,
    currentTime,
  }: {
    day: TZDate;
    data: RouterOutputs["trackerEntries"]["byRange"]["result"] | undefined;
    user: any;
    handleMouseDown: (date: TZDate) => void;
    handleMouseEnter: (date: TZDate) => void;
    handleMouseUp: () => void;
    onEventClick?: (eventId: string, date: TZDate) => void;
    currentTime: Date;
  }) => {
    // Memoize the processed entries to prevent recalculation on every render
    const positionedEntries = useMemo(() => {
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
            // Fallback with timezone parameter if timezone conversion fails
            startSlot = getSlotFromDate(startDate, displayTimezone);
            originalEndSlot = getSlotFromDate(endDate, displayTimezone);
          }
        } else {
          startSlot = getSlotFromDate(startDate, displayTimezone);
          originalEndSlot = getSlotFromDate(endDate, displayTimezone);
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

        let displayStartSlot = startSlot;
        let displayEndSlot = originalEndSlot;
        let isContinuation = false;

        // Check if this is a running timer (no stop time)
        const isRunningTimer = !event.stop || event.stop === null;

        if (isRunningTimer) {
          // Calculate current time slot for running timer
          const currentSlot = getSlotFromDate(currentTime, displayTimezone);
          displayEndSlot = Math.max(startSlot + 1, currentSlot); // At least 1 slot minimum
        } else {
          // Always show entries stored under the current date
          if (event.date === currentDayStr) {
            // This entry was created on this date - show it as the primary display
            if (spansMidnight || originalEndSlot < startSlot) {
              // For midnight-spanning entries or entries that wrap around, extend to end of day
              displayEndSlot = 96; // End of day (extends to midnight)
            }
            // Keep the original start slot even if it appears to be from "yesterday" due to timezone
            // This ensures the entry is visible on the day it was created
          } else if (spansMidnight && endDateStr === currentDayStr) {
            // This is a continuation from a previous day
            // Show the continuation part (from midnight to end time)
            displayStartSlot = 0; // Start of day (midnight)
            displayEndSlot = originalEndSlot; // Original end time converted to user timezone
            isContinuation = true;
          } else {
            // This entry doesn't belong to this day - skip it
            return;
          }
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
      const userTimezone = user?.timezone || "UTC";

      // Simple previous day calculation using the date string directly
      const parts = currentDayStr.split("-").map(Number);
      const year = parts[0]!;
      const month = parts[1]!;
      const dayNum = parts[2]!;
      const previousDateObj = new Date(year, month - 1, dayNum - 1); // month is 0-indexed in JS Date
      const previousDayStr = format(previousDateObj, "yyyy-MM-dd");

      const previousDayData =
        (data && previousDayStr && data[previousDayStr]) || [];

      previousDayData.forEach((event: any, eventIndex: number) => {
        const startDate = createSafeDate(event.start);
        const endDate = createSafeDate(event.stop);

        // Convert to user timezone to check if it spans midnight in their local time
        // userTimezone already declared above
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
              originalEndSlot = getSlotFromDate(endDate, userTimezone);
            }
          } else {
            originalEndSlot = getSlotFromDate(endDate, userTimezone);
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

      // Calculate positions for overlapping events
      return calculateEventPositions(allEntries);
    }, [day, data, user?.timezone, currentTime]);

    return (
      <>
        {positionedEntries.map((entry) => {
          const top = entry.displayStartSlot * SLOT_HEIGHT;
          const height = Math.max(
            (entry.displayEndSlot - entry.displayStartSlot) * SLOT_HEIGHT,
            20,
          );

          // Check if this is a running timer
          const isRunningTimer = !entry.event.stop || entry.event.stop === null;

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
              className={cn(
                "absolute text-xs p-2 overflow-hidden cursor-pointer transition-colors",
                // Same styling for all events
                "bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] hover:bg-[#E8E8E8] dark:hover:bg-[#252525]",
                entry.totalColumns > 1 && entry.column > 0
                  ? "border border-border"
                  : "",
              )}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                left:
                  entry.leftPx !== undefined
                    ? `${entry.leftPx}px`
                    : `${entry.left}%`,
                width:
                  entry.leftPx !== undefined
                    ? `calc(${entry.width}% - ${entry.leftPx}px)`
                    : `${entry.width}%`,
                zIndex: entry.totalColumns > 1 ? 20 + entry.column : 10,
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
                    part.classList.remove(
                      "!bg-[#E8E8E8]",
                      "dark:!bg-[#252525]",
                    );
                  }
                }
              }}
              onMouseUp={handleMouseUp}
              data-event-id={entry.event.id}
            >
              <div className="font-medium truncate leading-tight flex items-center gap-1">
                {/* Subtle green dot indicator for running timers */}
                {isRunningTimer && (
                  <span className="relative flex h-1 w-1 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-green-500" />
                  </span>
                )}
                <span className="truncate">
                  {entry.event.trackerProject?.name || "No Project"}
                  {entry.spansMidnight && entry.isFromCurrentDay && " →"}
                  {entry.isContinuation && " ←"}
                </span>
                {height <= 40 && height > 16 && (
                  <span className="font-normal text-[#878787] dark:text-[#606060] flex-shrink-0">
                    {" ("}
                    {isRunningTimer
                      ? secondsToHoursAndMinutes(
                          Math.max(
                            0,
                            Math.round(
                              (currentTime.getTime() -
                                createSafeDate(entry.event.start).getTime()) /
                                1000,
                            ),
                          ),
                        )
                      : secondsToHoursAndMinutes(
                          entry.spansMidnight || entry.isContinuation
                            ? (entry.displayEndSlot - entry.displayStartSlot) *
                                15 *
                                60 // Use slot-based calculation for split events
                            : (entry.event.duration ?? 0), // Use original duration for normal events
                        )}
                    {")"}
                  </span>
                )}
              </div>
              {height > 40 && (
                <div className="truncate text-[#878787] dark:text-[#606060]">
                  (
                  {isRunningTimer
                    ? secondsToHoursAndMinutes(
                        Math.max(
                          0,
                          Math.round(
                            (currentTime.getTime() -
                              createSafeDate(entry.event.start).getTime()) /
                              1000,
                          ),
                        ),
                      )
                    : secondsToHoursAndMinutes(
                        entry.spansMidnight || entry.isContinuation
                          ? (entry.displayEndSlot - entry.displayStartSlot) *
                              15 *
                              60 // Use slot-based calculation for split events
                          : (entry.event.duration ?? 0), // Use original duration for normal events
                      )}
                  )
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  },
);

DayEntries.displayName = "DayEntries";

// Optimized: Main component with memoization
export const CalendarWeekView = memo(
  ({
    weekDays,
    currentDate,
    data,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    onEventClick,
  }: CalendarWeekViewProps) => {
    const { data: user } = useUserQuery();
    const is24Hour = user?.timeFormat === 24;

    // State to force re-render for running timers
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every 5 seconds for running timers
    useEffect(() => {
      // Check if any running timers exist across all days
      const hasRunningTimers =
        data &&
        Object.values(data).some((dayData) =>
          dayData.some((event) => !event.stop || event.stop === null),
        );

      if (hasRunningTimers) {
        const interval = setInterval(() => {
          setCurrentTime(new Date());
        }, 5000); // Update every 5 seconds for better visual feedback

        return () => clearInterval(interval);
      }
    }, [data]);

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
              className="py-4 px-2 bg-background text-xs font-medium text-[#878787] text-center"
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
                  className="flex items-center justify-center text-[12px] text-[#878787] border-b border-border"
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
                      <div className="absolute left-1 top-0.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none bg-background/80 px-1 rounded">
                        {formatHour(hour, user?.timeFormat)}
                      </div>
                    </div>
                  );
                })}

                {/* Events for this day */}
                <DayEntries
                  day={day}
                  data={data}
                  user={user}
                  handleMouseDown={handleMouseDown}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseUp={handleMouseUp}
                  onEventClick={onEventClick}
                  currentTime={currentTime}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CalendarWeekView.displayName = "CalendarWeekView";
