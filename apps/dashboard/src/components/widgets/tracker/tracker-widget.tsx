"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { sortDates, splitCrossDayForDisplay } from "@/utils/tracker";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { TrackerHeader } from "./tracker-header";
import { TrackerIndicator } from "./tracker-indicator";

export function TrackerWidget() {
  const ref = useRef<HTMLDivElement>(null);
  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
  } = useTrackerParams({ initialDate: new Date().toISOString() });

  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.trackerEntries.byRange.queryOptions({
      from: formatISO(startOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
      to: formatISO(endOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
    }),
  );

  const { data: user } = useUserQuery();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);

  const monthStart = startOfMonth(new Date(currentDate));
  const monthEnd = endOfMonth(new Date(currentDate));
  const calendarStart = startOfWeek(monthStart, {
    weekStartsOn: user?.weekStartsOnMonday ? 1 : 0,
  });

  const calendarEnd = endOfWeek(monthEnd, {
    weekStartsOn: user?.weekStartsOnMonday ? 1 : 0,
  });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const sortedDates = sortDates(range ?? []);

  const firstWeek = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, {
      weekStartsOn: user?.weekStartsOnMonday ? 1 : 0,
    }),
  });

  // @ts-expect-error
  useOnClickOutside(ref, () => {
    if (range?.length === 1) {
      setParams({ range: null });
    }
  });

  // Process data with cross-day splitting for calendar display
  const processedData = useMemo(() => {
    if (!data?.result) return undefined;

    const processedResult: Record<string, any[]> = {};

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

    return processedResult;
  }, [data?.result]);

  const getEventCount = (date: Date) => {
    const formattedDate = formatISO(date, { representation: "date" });
    const result = processedData ?? {};
    return result[formattedDate]?.length ?? 0;
  };

  const handleMouseDown = (date: Date) => {
    setIsDragging(true);
    const dateStr = formatISO(date, { representation: "date" });
    setDragStart(dateStr);
    setDragEnd(null);
    setParams({ range: [dateStr] });
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging) {
      setDragEnd(formatISO(date, { representation: "date" }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (dragStart && dragEnd) {
      setParams({
        range: [dragStart, dragEnd].sort(),
      });
    } else if (dragStart) {
      setParams({ selectedDate: dragStart, range: null });
    }
    setDragStart(null);
    setDragEnd(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragEnd]);

  return (
    <div ref={ref}>
      <TrackerHeader totalDuration={data?.meta?.totalDuration} />

      <div className="mt-4">
        <div className="grid grid-cols-7 gap-px border border-border bg-border">
          {firstWeek.map((day) => (
            <div
              key={day.toString()}
              className="py-4 px-3 bg-background text-xs font-medium text-[#878787] font-mono"
            >
              {format(day, "EEE").toUpperCase()}
            </div>
          ))}
          {calendarDays.map((date, index) => {
            const isCurrentMonth =
              new Date(date).getMonth() === new Date(currentDate).getMonth();
            const dateStr = formatISO(date, { representation: "date" });
            const isInDragRange =
              dragStart &&
              dragEnd &&
              ((dateStr >= dragStart && dateStr <= dragEnd) ||
                (dateStr <= dragStart && dateStr >= dragEnd));

            return (
              <button
                type="button"
                onMouseDown={() => handleMouseDown(date)}
                onMouseEnter={() => handleMouseEnter(date)}
                key={index.toString()}
                className={cn(
                  "pt-2 pb-5 px-3 font-mono text-sm relative transition-all duration-100 text-left aspect-square",
                  isCurrentMonth && isToday(date)
                    ? "bg-[#f0f0f0] dark:bg-[#202020]"
                    : "bg-background",
                  !isCurrentMonth &&
                    "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
                  selectedDate === dateStr && "ring-1 ring-primary",
                  (range?.includes(dateStr) ||
                    (sortedDates.length === 2 &&
                      date >= new Date(sortedDates[0] || 0) &&
                      date <= new Date(sortedDates[1] || 0))) &&
                    "ring-1 ring-primary",
                  isInDragRange && "ring-1 ring-primary",
                )}
              >
                <div>{format(date, "d")}</div>
                <TrackerIndicator
                  count={getEventCount(date)}
                  isToday={isToday(date)}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
