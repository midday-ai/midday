"use client";

import { useBillableHours } from "@/hooks/use-billable-hours";
import { useCalendarDates } from "@/hooks/use-calendar-dates";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { useRef, useState } from "react";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useOnClickOutside } from "usehooks-ts";
import { CalendarHeader } from "./tracker/calendar-header";
import { CalendarMonthView } from "./tracker/calendar-month-view";
import { CalendarWeekView } from "./tracker/calendar-week-view";

type Props = {
  weeklyCalendar: boolean;
};

export function TrackerCalendar({ weeklyCalendar }: Props) {
  const ref = useRef(null);
  const { data: user } = useUserQuery();
  const trpc = useTRPC();

  const weekStartsOnMonday = user?.weekStartsOnMonday ?? false;

  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
    view,
  } = useTrackerParams();

  const selectedView = view ?? (weeklyCalendar ? "week" : "month");

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

  // Calculate current week days for week view
  const currentWeekDays = React.useMemo(() => {
    const weekStart = startOfWeek(currentTZDate, {
      weekStartsOn: weekStartsOnMonday ? 1 : 0,
    });

    const weekEnd = endOfWeek(currentTZDate, {
      weekStartsOn: weekStartsOnMonday ? 1 : 0,
    });

    return eachDayOfInterval({
      start: weekStart,
      end: weekEnd,
    }).map((date) => new TZDate(date, "UTC"));
  }, [currentTZDate, weekStartsOnMonday]);

  // Dynamic data fetching based on view
  const getDateRange = () => {
    if (selectedView === "week") {
      const weekStart = startOfWeek(currentTZDate, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });
      const weekEnd = endOfWeek(currentTZDate, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });
      return {
        from: formatISO(weekStart, { representation: "date" }),
        to: formatISO(weekEnd, { representation: "date" }),
      };
    }
    // For monthly view, extend the range to include buffer days for midnight-spanning entries
    const monthStart = startOfMonth(currentTZDate);
    const monthEnd = endOfMonth(currentTZDate);

    // Add 1 day buffer before and after to handle midnight-spanning entries
    const extendedStart = new Date(monthStart);
    extendedStart.setDate(extendedStart.getDate() - 1);

    const extendedEnd = new Date(monthEnd);
    extendedEnd.setDate(extendedEnd.getDate() + 1);

    return {
      from: formatISO(extendedStart, { representation: "date" }),
      to: formatISO(extendedEnd, { representation: "date" }),
    };
  };

  const { data } = useQuery(
    trpc.trackerEntries.byRange.queryOptions(getDateRange()),
  );

  // Single source of truth for billable hours calculations
  const { data: billableHoursData } = useBillableHours({
    date: currentDate,
    view: selectedView,
    weekStartsOnMonday,
  });

  function handlePeriodChange(direction: number) {
    if (selectedView === "week") {
      const newDate =
        direction > 0 ? addWeeks(currentTZDate, 1) : subWeeks(currentTZDate, 1);
      setParams({
        date: formatISO(
          startOfWeek(newDate, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
          { representation: "date" },
        ),
      });
    } else {
      const newDate =
        direction > 0
          ? addMonths(currentTZDate, 1)
          : subMonths(currentTZDate, 1);
      setParams({
        date: formatISO(newDate, { representation: "date" }),
      });
    }
  }

  useHotkeys("arrowLeft", () => handlePeriodChange(-1), {
    enabled: !selectedDate,
  });

  useHotkeys("arrowRight", () => handlePeriodChange(1), {
    enabled: !selectedDate,
  });

  // @ts-expect-error
  useOnClickOutside(ref, () => {
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

      setParams({
        range: [formattedStart, formattedEnd],
        selectedDate: null,
        eventId: null,
      });
    } else if (localRange[0]) {
      setParams({ selectedDate: localRange[0], range: null, eventId: null });
    }
    setLocalRange([null, null]);
  };

  const handleEventClick = (eventId: string, date: TZDate) => {
    const formattedDate = formatISO(date, { representation: "date" });
    setParams({
      selectedDate: formattedDate,
      eventId: eventId,
      range: null,
    });
  };

  const validRange: [string, string] | null =
    range && range.length === 2 ? [range[0]!, range[1]!] : null;

  return (
    <div ref={ref}>
      <div className="mt-8">
        <CalendarHeader
          totalDuration={billableHoursData?.totalDuration}
          selectedView={selectedView as "week" | "month"}
          billableHoursData={billableHoursData}
        />
        {selectedView === "month" ? (
          <CalendarMonthView
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
            onEventClick={handleEventClick}
          />
        ) : (
          <CalendarWeekView
            weekDays={currentWeekDays}
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
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </div>
  );
}
