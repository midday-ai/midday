"use client";

import { useCalendarDates } from "@/hooks/use-calendar-dates";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { useQuery } from "@tanstack/react-query";
import { useClickAway } from "@uidotdev/usehooks";
import {
  addMonths,
  endOfMonth,
  formatISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { CalendarGrid } from "./tracker/calendar-grid";
import { CalendarHeader } from "./tracker/calendar-header";

export function TrackerCalendar() {
  const { data: user } = useUserQuery();
  const trpc = useTRPC();

  const weekStartsOnMonday = user?.week_starts_on_monday ?? false;

  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
  } = useTrackerParams();

  const [isDragging, setIsDragging] = useState(false);
  const [localRange, setLocalRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const currentTZDate = new TZDate(currentDate, "UTC");

  const { calendarDays, firstWeek } = useCalendarDates(
    currentTZDate,
    weekStartsOnMonday,
  );

  const { data } = useQuery(
    trpc.trackerEntries.byRange.queryOptions({
      from: formatISO(startOfMonth(currentTZDate), {
        representation: "date",
      }),
      to: formatISO(endOfMonth(currentTZDate), {
        representation: "date",
      }),
    }),
  );

  function handleMonthChange(direction: number) {
    const newDate =
      direction > 0 ? addMonths(currentTZDate, 1) : subMonths(currentTZDate, 1);
    setParams({
      date: formatISO(newDate, { representation: "date" }),
    });
  }

  useHotkeys("arrowLeft", () => handleMonthChange(-1), {
    enabled: !selectedDate,
  });

  useHotkeys("arrowRight", () => handleMonthChange(1), {
    enabled: !selectedDate,
  });

  const ref = useClickAway<HTMLDivElement>(() => {
    if (range && range.length === 1) setParams({ range: null });
  });

  const handleMouseDown = (date: TZDate) => {
    setIsDragging(true);
    const formatted = formatISO(date, { representation: "date" });
    setLocalRange([formatted, null]);
    setParams({ selectedDate: null, range: null });
  };

  const handleMouseEnter = (date: TZDate) => {
    if (isDragging && localRange[0]) {
      setLocalRange((prev) => [
        prev[0],
        formatISO(date, { representation: "date" }),
      ]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (localRange[0] && localRange[1]) {
      let start = new TZDate(localRange[0], "UTC");
      let end = new TZDate(localRange[1], "UTC");
      if (start > end) [start, end] = [end, start];

      const formattedStart = formatISO(start, { representation: "date" });
      const formattedEnd = formatISO(end, { representation: "date" });

      setParams({ range: [formattedStart, formattedEnd], selectedDate: null });
    } else if (localRange[0]) {
      setParams({ selectedDate: localRange[0], range: null });
    }
    setLocalRange([null, null]);
  };

  const validRange: [string, string] | null =
    range && range.length === 2 ? [range[0]!, range[1]!] : null;

  return (
    <div ref={ref}>
      <div className="mt-8">
        <CalendarHeader totalDuration={data?.meta?.totalDuration} />
        <CalendarGrid
          firstWeek={firstWeek}
          calendarDays={calendarDays}
          currentDate={currentTZDate}
          selectedDate={selectedDate}
          data={data?.result}
          range={validRange}
          localRange={localRange}
          isDragging={isDragging}
          weekStartsOnMonday={weekStartsOnMonday}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          handleMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
}
