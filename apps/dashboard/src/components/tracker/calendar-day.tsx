import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { format, formatISO, isToday } from "date-fns";
import type React from "react";
import { useCallback } from "react";
import { TrackerEvents } from "./events";
import {
  checkIsFirstSelectedDate,
  checkIsInRange,
  checkIsLastSelectedDate,
} from "./utils";

type CalendarDayProps = {
  date: TZDate;
  currentDate: TZDate;
  selectedDate: string | null;
  dayData:
    | RouterOutputs["trackerEntries"]["byRange"]["result"][string]
    | undefined;
  allData?: RouterOutputs["trackerEntries"]["byRange"]["result"];
  range: [string, string] | null;
  localRange: [string | null, string | null];
  isDragging: boolean;
  handleMouseDown: (date: TZDate) => void;
  handleMouseEnter: (date: TZDate) => void;
  handleMouseUp: () => void;
  onEventClick?: (eventId: string, date: TZDate) => void;
};

export function CalendarDay({
  date,
  currentDate,
  selectedDate,
  dayData,
  allData,
  range,
  localRange,
  isDragging,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
  onEventClick,
}: CalendarDayProps) {
  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
  const formattedDate = formatISO(date, { representation: "date" });

  const isInRange = useCallback(
    (date: TZDate) => checkIsInRange(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const isFirstSelectedDate = useCallback(
    (date: TZDate) =>
      checkIsFirstSelectedDate(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const isLastSelectedDate = useCallback(
    (date: TZDate) =>
      checkIsLastSelectedDate(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const handleDayClick = (event: React.MouseEvent) => {
    // Check if the click target is a continuation event
    const target = event.target as HTMLElement;
    const isContinuation = target.closest('[data-is-continuation="true"]');
    const eventTarget = target.closest("[data-event-id]");

    if (isContinuation) {
      // If this is a continuation event, select the previous day
      event.preventDefault();
      event.stopPropagation();
      const previousDay = new Date(date);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousDayTZ = new TZDate(previousDay, "UTC");
      handleMouseDown(previousDayTZ);
    } else if (eventTarget && onEventClick) {
      // Handle event click on current day
      const eventId = eventTarget.getAttribute("data-event-id");
      if (eventId) {
        event.preventDefault();
        event.stopPropagation();
        onEventClick(eventId, date);
        return;
      }
    } else {
      // Normal behavior - select current day (including for "show all events" clicks)
      handleMouseDown(date);
    }
  };

  return (
    <div
      onMouseDown={handleDayClick}
      onMouseEnter={() => handleMouseEnter(date)}
      onMouseUp={handleMouseUp}
      className={cn(
        "aspect-square md:aspect-[4/2] pt-2 pb-10 px-3 font-mono text-lg relative transition-all duration-100 text-left flex space-x-2 select-none",
        isCurrentMonth && isToday(date)
          ? "bg-[#f0f0f0] dark:bg-[#202020]"
          : "bg-background",
        !isCurrentMonth &&
          "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)] text-[#878787]",
        selectedDate === formattedDate && "ring-1 ring-primary",
        isInRange(date) && "ring-1 ring-primary bg-opacity-50",
        isFirstSelectedDate(date) && "ring-1 ring-primary bg-opacity-50",
        isLastSelectedDate(date) && "ring-1 ring-primary bg-opacity-50",
      )}
    >
      <div>{format(date, "d")}</div>
      <TrackerEvents
        data={dayData ?? []}
        isToday={isToday(date)}
        allData={allData}
        currentDate={date}
        onEventClick={onEventClick}
      />
    </div>
  );
}
