"use client";

import { useUserQuery } from "@/hooks/use-user";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { createSafeDate, formatHour, getSlotFromDate } from "@/utils/tracker";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import type { TZDate } from "@date-fns/tz";
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
};

const SLOT_HEIGHT = 6.5;
const HOUR_HEIGHT = 26; // Fill the available height (600px - header) / 24 hours ≈ 26px
const hours = Array.from({ length: 25 }, (_, i) => i); // 0-24 for cleaner display

export function CalendarWeekView({
  weekDays,
  currentDate,
  data,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
}: CalendarWeekViewProps) {
  const { data: user } = useUserQuery();
  const is24Hour = user?.timeFormat === 24;

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
          const dayData = data?.[dayKey] || [];

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
              {dayData.map((event, eventIndex) => {
                const startDate = createSafeDate(event.start);
                const endDate = createSafeDate(event.stop);
                const startSlot = getSlotFromDate(startDate);

                // Helper function to get end slot for cross-day entries
                const getEndSlotForEntry = (
                  entry: any,
                  selectedDate: string,
                ): number => {
                  const stopDate = createSafeDate(entry.stop);
                  const stopSlot = getSlotFromDate(stopDate);

                  // Check if this entry segment ends at local midnight (for cross-day entries)
                  // Use the exact same logic as splitCrossDayForDisplay
                  const nextDayMidnightUTC = new Date(selectedDate);
                  nextDayMidnightUTC.setDate(nextDayMidnightUTC.getDate() + 1);
                  nextDayMidnightUTC.setHours(0, 0, 0, 0);

                  // If the stop time matches the calculated midnight, this is the end of the first day
                  if (
                    Math.abs(
                      stopDate.getTime() - nextDayMidnightUTC.getTime(),
                    ) < 1000
                  ) {
                    return 96; // End of day (24 hours * 4 slots per hour)
                  }

                  return stopSlot;
                };

                const endSlot = getEndSlotForEntry(event, dayKey);
                const top = startSlot * SLOT_HEIGHT;
                const height = Math.max(
                  (endSlot - startSlot) * SLOT_HEIGHT,
                  20,
                );

                return (
                  <div
                    key={`${event.id}-${eventIndex}`}
                    className="absolute left-0 right-0 text-xs bg-[#F0F0F0] dark:bg-[#1D1D1D] text-[#606060] dark:text-[#878787] p-2 z-10 overflow-hidden cursor-pointer hover:bg-[#E8E8E8] dark:hover:bg-[#252525] transition-colors"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                    onMouseDown={() => handleMouseDown(day)}
                    onMouseEnter={() => handleMouseEnter(day)}
                    onMouseUp={handleMouseUp}
                  >
                    <div className="font-medium truncate leading-tight">
                      {event.trackerProject?.name || "No Project"}
                    </div>
                    {height > 24 && (
                      <div className="truncate">
                        ({secondsToHoursAndMinutes(event.duration || 0)})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
