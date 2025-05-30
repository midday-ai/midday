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

const ROW_HEIGHT = 60;
const SLOT_HEIGHT = 15;
const hours = Array.from({ length: 24 }, (_, i) => i);

export function CalendarWeekView({
  weekDays,
  currentDate,
  selectedDate,
  data,
  range,
  localRange,
  isDragging,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
}: CalendarWeekViewProps) {
  const { data: user } = useUserQuery();

  return (
    <div className="border border-border bg-border">
      {/* Day headers */}
      <div className="grid grid-cols-8 gap-px bg-border">
        {/* Empty space above time column */}
        <div className="py-4 px-3 bg-background" />

        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={`header-${day.toString()}`}
            className="py-4 px-3 bg-background text-xs font-medium text-[#878787] font-mono text-center"
          >
            <div className="flex flex-col items-center space-y-1">
              <div>{format(day, "EEE").toUpperCase()}</div>
              <div className="text-foreground font-semibold text-sm">
                {format(day, "d")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time slots and days */}
      <div className="grid grid-cols-8 gap-px bg-border">
        {/* Time labels column */}
        <div className="bg-background">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] pr-3 pl-3 flex items-start justify-end pt-2 text-xs text-[#878787] font-mono border-b border-border last:border-b-0"
            >
              {formatHour(hour, user?.timeFormat)}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayData = data?.[dayKey] || [];

          return (
            <div key={dayKey} className="bg-background relative">
              {/* Hour grid lines */}
              {hours.map((hour) => (
                <div
                  key={`${dayKey}-${hour}`}
                  className="h-[60px] border-b border-border last:border-b-0 relative"
                  onMouseDown={() => handleMouseDown(day)}
                  onMouseEnter={() => handleMouseEnter(day)}
                  onMouseUp={handleMouseUp}
                />
              ))}

              {/* Events for this day */}
              {dayData.map((event, eventIndex) => {
                const startDate = createSafeDate(event.start);
                const endDate = createSafeDate(event.stop);
                const startSlot = getSlotFromDate(startDate);
                const endSlot = getSlotFromDate(endDate);
                const top = startSlot * SLOT_HEIGHT;
                const height = Math.max(
                  (endSlot - startSlot) * SLOT_HEIGHT,
                  30,
                );

                return (
                  <div
                    key={`${event.id}-${eventIndex}`}
                    className={cn(
                      "absolute left-1 right-1 bg-[#F0F0F0]/95 dark:bg-[#2C2C2C]/95 text-[#606060] dark:text-[#878787] rounded-sm px-2 py-1 text-xs z-10 overflow-hidden",
                      "border-l-2 border-primary",
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                  >
                    <div className="font-medium truncate">
                      {event.trackerProject?.name || "No Project"}
                    </div>
                    <div className="text-xs opacity-75">
                      ({secondsToHoursAndMinutes(event.duration || 0)})
                    </div>
                    {event.description && (
                      <div className="text-xs opacity-60 truncate mt-1">
                        {event.description}
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
