"use client";

import { useCalendarDates } from "@/hooks/use-calendar-dates";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { splitCrossDayForDisplay } from "@/utils/tracker";
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
import { useMemo, useRef, useState } from "react";
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
    return {
      from: formatISO(startOfMonth(currentTZDate), { representation: "date" }),
      to: formatISO(endOfMonth(currentTZDate), { representation: "date" }),
    };
  };

  const { data } = useQuery(
    trpc.trackerEntries.byRange.queryOptions(getDateRange()),
  );

  // Process data for calendar display with cross-day spanning
  const { processedData, spanningEntries } = useMemo(() => {
    if (!data?.result) return { processedData: undefined, spanningEntries: [] };

    const processedResult: Record<string, any[]> = {};
    const spanningEntries: Array<{
      entry: any;
      startDate: string;
      endDate: string;
      startIndex: number;
      endIndex: number;
      week: number;
    }> = [];

    // Process each day's entries
    for (const [originalDate, entries] of Object.entries(data.result)) {
      for (const entry of entries) {
        if (!entry.start || !entry.stop) continue;

        // Use local time boundaries for cross-day detection (consistent with splitCrossDayForDisplay)
        const startDateObj = new Date(entry.start);
        const stopDateObj = new Date(entry.stop);
        const startDateLocal = new Date(
          startDateObj.getTime() - startDateObj.getTimezoneOffset() * 60000,
        );
        const stopDateLocal = new Date(
          stopDateObj.getTime() - stopDateObj.getTimezoneOffset() * 60000,
        );
        const startDate = startDateLocal.toISOString().split("T")[0];
        const stopDate = stopDateLocal.toISOString().split("T")[0];

        if (!startDate || !stopDate) continue;

        // Check if this is a cross-day entry
        if (startDate !== stopDate) {
          // Calculate grid positions for spanning
          const startDay = calendarDays.find(
            (d) => d.toISOString().split("T")[0] === startDate,
          );
          const endDay = calendarDays.find(
            (d) => d.toISOString().split("T")[0] === stopDate,
          );

          if (startDay && endDay) {
            const startIndex = calendarDays.indexOf(startDay);
            const endIndex = calendarDays.indexOf(endDay);
            const week = Math.floor(startIndex / 7);

            spanningEntries.push({
              entry,
              startDate,
              endDate: stopDate,
              startIndex,
              endIndex,
              week,
            });
          }
        }

        // For cross-day entries, we need to process them for all dates they span
        if (startDate !== stopDate) {
          // Get all dates between start and stop
          const datesInRange = [];

          const currentDate = new Date(startDate);
          const endDate = new Date(stopDate);
          while (currentDate <= endDate) {
            datesInRange.push(currentDate.toISOString().split("T")[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Process entry for each date it spans
          for (const dateInRange of datesInRange) {
            if (!dateInRange) continue;
            const splitEntries = splitCrossDayForDisplay(entry, dateInRange);
            for (const splitEntry of splitEntries) {
              // Use the dateInRange instead of deriving from start time
              // This ensures cross-day entries appear on the correct days
              if (!processedResult[dateInRange]) {
                processedResult[dateInRange] = [];
              }
              processedResult[dateInRange].push(splitEntry);
            }
          }
        } else {
          // For non-cross-day entries, process normally
          const splitEntries = splitCrossDayForDisplay(entry, originalDate);
          for (const splitEntry of splitEntries) {
            // Use the originalDate instead of deriving from start time
            if (!processedResult[originalDate]) {
              processedResult[originalDate] = [];
            }
            processedResult[originalDate].push(splitEntry);
          }
        }
      }
    }

    return { processedData: processedResult, spanningEntries };
  }, [data?.result, calendarDays]);

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
        <CalendarHeader
          totalDuration={data?.meta?.totalDuration}
          selectedView={selectedView as "week" | "month"}
        />
        {selectedView === "month" ? (
          <CalendarMonthView
            firstWeek={firstWeek}
            calendarDays={calendarDays}
            currentDate={currentTZDate}
            selectedDate={selectedDate}
            data={processedData}
            spanningEntries={spanningEntries}
            range={validRange}
            localRange={localRange}
            isDragging={isDragging}
            weekStartsOnMonday={weekStartsOnMonday}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseUp={handleMouseUp}
          />
        ) : (
          <CalendarWeekView
            weekDays={currentWeekDays}
            currentDate={currentTZDate}
            selectedDate={selectedDate}
            data={processedData}
            range={validRange}
            localRange={localRange}
            isDragging={isDragging}
            weekStartsOnMonday={weekStartsOnMonday}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            handleMouseUp={handleMouseUp}
          />
        )}
      </div>
    </div>
  );
}
