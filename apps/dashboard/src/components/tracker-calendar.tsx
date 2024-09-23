"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRangeQuery } from "@midday/supabase/queries";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
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
import MotionNumber from "motion-number";
import { useCallback, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TrackerEvents } from "./tracker-events";
import { TrackerMonthSelect } from "./tracker-month-select";
import { TrackerSettings } from "./tracker-settings";

type Props = {
  teamId: string;
  userId: string;
  weekStartsOnMonday?: boolean;
  timeFormat: number;
};

export function TrackerCalendar({
  teamId,
  userId,
  weekStartsOnMonday = false,
  timeFormat,
}: Props) {
  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
  } = useTrackerParams();
  const supabase = createClient();
  const [data, setData] = useState<Record<string, TrackerEvent[]>>({});
  const [meta, setMeta] = useState<{ totalDuration?: number }>({});
  const [localRange, setLocalRange] = useState<[string, string | null]>([
    "",
    null,
  ]);
  const [isDragging, setIsDragging] = useState(false);

  const { monthStart, monthEnd, calendarDays, firstWeek } = useCalendarDates(
    currentDate,
    weekStartsOnMonday,
  );

  useEffect(() => {
    fetchTrackerData(supabase, teamId, monthStart, monthEnd, setData, setMeta);
  }, [currentDate]);

  useHotkeys("arrowLeft", () => handleMonthChange(-1, currentDate, setParams), {
    enabled: !selectedDate,
  });

  useHotkeys("arrowRight", () => handleMonthChange(1, currentDate, setParams), {
    enabled: !selectedDate,
  });

  const ref = useClickAway<HTMLDivElement>(() => {
    if (range?.length === 1) setParams({ range: null });
  });

  const handleMouseDown = (date: Date) => {
    setIsDragging(true);
    setLocalRange([formatISO(date, { representation: "date" }), null]);
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging) {
      setLocalRange((prev) => [
        prev[0],
        formatISO(date, { representation: "date" }),
      ]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (localRange[0] && localRange[1]) {
      let start = new Date(localRange[0]);
      let end = new Date(localRange[1]);
      if (start > end) [start, end] = [end, start];

      setParams({ range: [localRange[0], localRange[1]] });
    } else if (localRange[0]) {
      setParams({ selectedDate: localRange[0] });
    }
    setLocalRange(["", null]);
  };

  return (
    <div ref={ref}>
      <div className="mt-8">
        <CalendarHeader
          meta={meta}
          data={data}
          timeFormat={timeFormat}
          weekStartsOnMonday={weekStartsOnMonday}
        />
        <CalendarGrid
          firstWeek={firstWeek}
          calendarDays={calendarDays}
          currentDate={currentDate}
          selectedDate={selectedDate}
          data={data}
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

function useCalendarDates(currentDate: Date, weekStartsOnMonday: boolean) {
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
  const firstWeek = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
  });

  return {
    monthStart,
    monthEnd,
    calendarStart,
    calendarEnd,
    calendarDays,
    firstWeek,
  };
}

async function fetchTrackerData(
  supabase: any,
  teamId: string,
  start: Date,
  end: Date,
  setData: React.Dispatch<React.SetStateAction<Record<string, TrackerEvent[]>>>,
  setMeta: React.Dispatch<React.SetStateAction<{ totalDuration?: number }>>,
) {
  const trackerData = await getTrackerRecordsByRangeQuery(supabase, {
    teamId,
    from: formatISO(start, { representation: "date" }),
    to: formatISO(end, { representation: "date" }),
  });

  setData(trackerData?.data || {});
  setMeta(trackerData?.meta || {});
}

function handleMonthChange(
  direction: number,
  currentDate: Date,
  setParams: (params: any) => void,
) {
  const newDate =
    direction > 0
      ? addMonths(new Date(currentDate), 1)
      : subMonths(new Date(currentDate), 1);
  setParams({
    date: formatISO(newDate, { representation: "date" }),
  });
}

type CalendarHeaderProps = {
  meta: { totalDuration?: number };
  data: Record<string, TrackerEvent[]>;
  timeFormat: number;
  weekStartsOnMonday: boolean;
};

function CalendarHeader({
  meta,
  data,
  timeFormat,
  weekStartsOnMonday,
}: CalendarHeaderProps) {
  const projectTotals = Object.entries(data).reduce(
    (acc, [_, events]) => {
      for (const event of events) {
        if (event.project) {
          acc[event.project.name] =
            (acc[event.project.name] || 0) + event.duration;
        }
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedProjects = Object.entries(projectTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, duration]) => ({ name, duration: duration / 3600 }));

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2 select-text">
        <h1 className="text-4xl font-mono">
          <MotionNumber
            value={meta?.totalDuration ? meta.totalDuration / 3600 : 0}
          />
          h
        </h1>
        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">Total this month</p>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <Icons.Info className="h-4 w-4 mt-1" />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs text-[#878787] w-[190px] p-0 dark:bg-background"
                side="bottom"
                sideOffset={10}
              >
                <div>
                  <div className="text-primary pb-2 border-b border-border px-4 pt-2">
                    Breakdown
                  </div>
                  <ul className="space-y-2 flex flex-col p-4">
                    {!Object.keys(projectTotals).length && (
                      <span>No tracked time.</span>
                    )}
                    {sortedProjects.map((project) => (
                      <li key={project.name} className="flex justify-between">
                        <span>{project.name}</span>
                        <span className="font-medium text-primary text-xs">
                          {project.duration}h
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex space-x-2">
        <TrackerMonthSelect dateFormat="MMMM" />
        <TrackerSettings
          timeFormat={timeFormat}
          weekStartsOnMonday={weekStartsOnMonday}
        />
      </div>
    </div>
  );
}

type CalendarGridProps = {
  firstWeek: Date[];
  calendarDays: Date[];
  currentDate: Date;
  selectedDate: string;
  data: Record<string, TrackerEvent[]>;
  range: [string, string] | null;
  localRange: [string, string | null];
  isDragging: boolean;
  weekStartsOnMonday: boolean;
  handleMouseDown: (date: Date) => void;
  handleMouseEnter: (date: Date) => void;
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
  date: Date;
  currentDate: Date;
  selectedDate: string;
  data: Record<string, TrackerEvent[]>;
  range: [string, string] | null;
  localRange: [string, string | null];
  isDragging: boolean;
  handleMouseDown: (date: Date) => void;
  handleMouseEnter: (date: Date) => void;
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
  const isCurrentMonth =
    new Date(date).getMonth() === new Date(currentDate).getMonth();
  const formattedDate = formatISO(date, { representation: "date" });

  const isInRange = useCallback(
    (date: Date) => checkIsInRange(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const isFirstSelectedDate = useCallback(
    (date: Date) =>
      checkIsFirstSelectedDate(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const isLastSelectedDate = useCallback(
    (date: Date) =>
      checkIsLastSelectedDate(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  return (
    <div
      onMouseDown={() => handleMouseDown(date)}
      onMouseEnter={() => handleMouseEnter(date)}
      onMouseUp={handleMouseUp}
      className={cn(
        "pt-2 pb-10 px-3 font-mono text-lg relative transition-all duration-100 text-left flex space-x-2 select-none",
        isCurrentMonth && isToday(date) ? "bg-[#202020]" : "bg-background",
        !isCurrentMonth &&
          "bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]",
        selectedDate === formattedDate && "ring-1 ring-white",
        isInRange(date) && "ring-1 ring-white bg-opacity-50",
        isFirstSelectedDate(date) && "ring-1 ring-white bg-opacity-50",
        isLastSelectedDate(date) && "ring-1 ring-white bg-opacity-50",
      )}
    >
      <div>{format(date, "d")}</div>
      <TrackerEvents data={data[formattedDate]} />
    </div>
  );
}

function checkIsInRange(
  date: Date,
  isDragging: boolean,
  localRange: [string, string | null],
  range: [string, string] | null,
) {
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new Date(localRange[0]);
    const end = new Date(localRange[1]);
    return (
      date >= new Date(Math.min(start.getTime(), end.getTime())) &&
      date <= new Date(Math.max(start.getTime(), end.getTime()))
    );
  }
  if (range && range.length === 2) {
    const start = new Date(range[0]);
    const end = new Date(range[1]);
    return (
      date >= new Date(Math.min(start.getTime(), end.getTime())) &&
      date <= new Date(Math.max(start.getTime(), end.getTime()))
    );
  }
  return false;
}

function checkIsFirstSelectedDate(
  date: Date,
  isDragging: boolean,
  localRange: [string, string | null],
  range: [string, string] | null,
) {
  if (isDragging && localRange[0]) {
    const start = new Date(localRange[0]);
    const end = localRange[1] ? new Date(localRange[1]) : start;
    const firstDate = new Date(Math.min(start.getTime(), end.getTime()));
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(firstDate, { representation: "date" })
    );
  }
  if (range && range.length > 0) {
    const start = new Date(range[0]);
    const end = new Date(range[1]);
    const firstDate = new Date(Math.min(start.getTime(), end.getTime()));
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(firstDate, { representation: "date" })
    );
  }
  return false;
}

function checkIsLastSelectedDate(
  date: Date,
  isDragging: boolean,
  localRange: [string, string | null],
  range: [string, string] | null,
) {
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new Date(localRange[0]);
    const end = new Date(localRange[1]);
    const lastDate = new Date(Math.max(start.getTime(), end.getTime()));
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(lastDate, { representation: "date" })
    );
  }
  if (range && range.length === 2) {
    const start = new Date(range[0]);
    const end = new Date(range[1]);
    const lastDate = new Date(Math.max(start.getTime(), end.getTime()));
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(lastDate, { representation: "date" })
    );
  }
  return false;
}
