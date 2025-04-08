"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useClickAway } from "@uidotdev/usehooks";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TrackerEvents } from "./tracker-events";
import { TrackerMonthSelect } from "./tracker-month-select";

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

  const { calendarDays, firstWeek } = useCalendarDates(
    new TZDate(currentDate, "UTC"),
    weekStartsOnMonday,
  );

  const { data } = useQuery(
    trpc.tracker.recordsByRange.queryOptions({
      from: formatISO(startOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
      to: formatISO(endOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
    }),
  );

  useHotkeys(
    "arrowLeft",
    () => handleMonthChange(-1, new TZDate(currentDate, "UTC")),
    {
      enabled: !selectedDate,
    },
  );

  useHotkeys(
    "arrowRight",
    () => handleMonthChange(1, new TZDate(currentDate, "UTC")),
    {
      enabled: !selectedDate,
    },
  );

  const ref = useClickAway<HTMLDivElement>(() => {
    if (range?.length === 1) setParams({ range: null });
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

  return (
    <div ref={ref}>
      <div className="mt-8">
        <CalendarHeader totalDuration={data?.meta?.totalDuration} />
        <CalendarGrid
          firstWeek={firstWeek}
          calendarDays={calendarDays}
          currentDate={new TZDate(currentDate, "UTC")}
          selectedDate={selectedDate}
          data={data?.result}
          range={range}
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

function useCalendarDates(currentDate: TZDate, weekStartsOnMonday: boolean) {
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
  }).map((date) => new TZDate(date, "UTC"));
  const firstWeek = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
  }).map((date) => new TZDate(date, "UTC"));

  return {
    monthStart,
    monthEnd,
    calendarStart,
    calendarEnd,
    calendarDays,
    firstWeek,
  };
}

function handleMonthChange(direction: number, currentDate: TZDate) {
  const { setParams } = useTrackerParams();
  const newDate =
    direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
  setParams({
    date: formatISO(newDate, { representation: "date" }),
  });
}

type CalendarHeaderProps = {
  totalDuration?: number;
};

function CalendarHeader({ totalDuration }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2 select-text">
        <h1 className="text-4xl font-mono">
          <NumberFlow
            value={totalDuration ? Math.round(totalDuration / 3600) : 0}
          />
          <span className="relative">h</span>
        </h1>
      </div>
      <div className="flex space-x-2">
        <TrackerMonthSelect dateFormat="MMMM" />
      </div>
    </div>
  );
}

type CalendarGridProps = {
  firstWeek: TZDate[];
  calendarDays: TZDate[];
  currentDate: TZDate;
  selectedDate: string | null;
  data: RouterOutputs["tracker"]["recordsByRange"]["result"] | undefined;
  range: [string, string] | null;
  localRange: [string | null, string | null];
  isDragging: boolean;
  weekStartsOnMonday: boolean;
  handleMouseDown: (date: TZDate) => void;
  handleMouseEnter: (date: TZDate) => void;
  handleMouseUp: () => void;
};

function CalendarGrid({
  firstWeek,
  calendarDays,
  currentDate,
  selectedDate,
  data,
  range,
  localRange,
  isDragging,
  weekStartsOnMonday,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
}: CalendarGridProps) {
  return (
    <div className="grid grid-cols-7 gap-px border border-border bg-border">
      {firstWeek.map((day) => (
        <div
          key={day.toString()}
          className="py-4 px-3 bg-background text-xs font-medium text-[#878787] font-mono"
        >
          {format(day, "EEE").toUpperCase()}
        </div>
      ))}
      {calendarDays.map((date, index) => (
        <CalendarDay
          key={index.toString()}
          date={date}
          currentDate={currentDate}
          selectedDate={selectedDate}
          data={data}
          range={range}
          localRange={localRange}
          isDragging={isDragging}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          handleMouseUp={handleMouseUp}
        />
      ))}
    </div>
  );
}

type CalendarDayProps = {
  date: TZDate;
  currentDate: TZDate;
  selectedDate: string | null;
  data: RouterOutputs["tracker"]["recordsByRange"]["result"] | undefined;
  range: [string, string] | null;
  localRange: [string | null, string | null];
  isDragging: boolean;
  handleMouseDown: (date: TZDate) => void;
  handleMouseEnter: (date: TZDate) => void;
  handleMouseUp: () => void;
};

function CalendarDay({
  date,
  currentDate,
  selectedDate,
  data,
  range,
  localRange,
  isDragging,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
}: CalendarDayProps) {
  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
  const formattedDate = formatISO(date, { representation: "date" });

  const dayData = data?.[formattedDate];

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

  return (
    <div
      onMouseDown={() => handleMouseDown(date)}
      onMouseEnter={() => handleMouseEnter(date)}
      onMouseUp={handleMouseUp}
      className={cn(
        "aspect-square md:aspect-[4/2] pt-2 pb-10 px-3 font-mono text-lg relative transition-all duration-100 text-left flex space-x-2 select-none",
        isCurrentMonth && isToday(date)
          ? "bg-[#f0f0f0] dark:bg-[#202020]"
          : "bg-background",
        !isCurrentMonth &&
          "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
        selectedDate === formattedDate && "ring-1 ring-primary",
        isInRange(date) && "ring-1 ring-primary bg-opacity-50",
        isFirstSelectedDate(date) && "ring-1 ring-primary bg-opacity-50",
        isLastSelectedDate(date) && "ring-1 ring-primary bg-opacity-50",
      )}
    >
      <div>{format(date, "d")}</div>
      <TrackerEvents data={dayData} isToday={isToday(date)} />
    </div>
  );
}

function checkIsInRange(
  date: TZDate,
  isDragging: boolean,
  localRange: [string | null, string | null],
  range: [string, string] | null,
): boolean {
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = new TZDate(localRange[1], "UTC");
    const minDate = new TZDate(Math.min(start.getTime(), end.getTime()), "UTC");
    const maxDate = new TZDate(Math.max(start.getTime(), end.getTime()), "UTC");
    return date > minDate && date < maxDate;
  }
  if (!isDragging && range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const minDate = new TZDate(Math.min(start.getTime(), end.getTime()), "UTC");
    const maxDate = new TZDate(Math.max(start.getTime(), end.getTime()), "UTC");
    return date > minDate && date < maxDate;
  }
  return false;
}

function checkIsFirstSelectedDate(
  date: TZDate,
  isDragging: boolean,
  localRange: [string | null, string | null],
  range: [string, string] | null,
): boolean {
  const formattedDate = formatISO(date, { representation: "date" });
  if (isDragging && localRange[0]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = localRange[1] ? new TZDate(localRange[1], "UTC") : start;
    const firstDate = new TZDate(
      Math.min(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(firstDate, { representation: "date" });
  }
  if (!isDragging && range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const firstDate = new TZDate(
      Math.min(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(firstDate, { representation: "date" });
  }
  return false;
}

function checkIsLastSelectedDate(
  date: TZDate,
  isDragging: boolean,
  localRange: [string | null, string | null],
  range: [string, string] | null,
): boolean {
  const formattedDate = formatISO(date, { representation: "date" });
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = new TZDate(localRange[1], "UTC");
    const lastDate = new TZDate(
      Math.max(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(lastDate, { representation: "date" });
  }
  if (!isDragging && range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const lastDate = new TZDate(
      Math.max(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(lastDate, { representation: "date" });
  }
  return false;
}
