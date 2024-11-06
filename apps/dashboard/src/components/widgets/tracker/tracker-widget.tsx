"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { sortDates } from "@/utils/tracker";
import { cn } from "@midday/ui/cn";
import { useClickAway } from "@uidotdev/usehooks";
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
import { useEffect, useState } from "react";
import { TrackerHeader } from "./tracker-header";
import { TrackerIndicator } from "./tracker-indicator";

type TrackerMeta = {
  totalDuration?: number;
};

type TrackerRecord = {
  id: string;
  duration: number;
  date: string;
};

type Props = {
  date?: string;
  meta?: TrackerMeta;
  data?: Record<string, TrackerRecord[]>;
  weekStartsOnMonday?: boolean;
};

export function TrackerWidget({
  date: initialDate,
  meta,
  data,
  weekStartsOnMonday = false,
}: Props) {
  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
  } = useTrackerParams(initialDate);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, {
    weekStartsOn: weekStartsOnMonday ? 1 : 0,
  });
  const calendarEnd = endOfWeek(monthEnd, {
    weekStartsOn: weekStartsOnMonday ? 1 : 0,
  });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const sortedDates = sortDates(range ?? []);

  const firstWeek = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
  });

  const ref = useClickAway<HTMLDivElement>(() => {
    if (range?.length === 1) {
      setParams({ range: null });
    }
  });

  const getEventCount = (date: Date) => {
    return data?.[formatISO(date, { representation: "date" })]?.length ?? 0;
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
      <TrackerHeader totalDuration={meta?.totalDuration} />

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
