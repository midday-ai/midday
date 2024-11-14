"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserContext } from "@/store/user/hook";
import { formatAmount, secondsToHoursAndMinutes } from "@/utils/format";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import NumberFlow from "@number-flow/react";
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

type Props = {
  weekStartsOnMonday?: boolean;
  timeFormat: number;
};

export function TrackerCalendar({
  weekStartsOnMonday = false,
  timeFormat,
  data,
  meta,
}: Props) {
  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
  } = useTrackerParams();
  const [localRange, setLocalRange] = useState<[string, string | null]>([
    "",
    null,
  ]);
  const [isDragging, setIsDragging] = useState(false);

  const { calendarDays, firstWeek } = useCalendarDates(
    new TZDate(currentDate, "UTC"),
    weekStartsOnMonday,
  );

  useHotkeys(
    "arrowLeft",
    () => handleMonthChange(-1, new TZDate(currentDate, "UTC"), setParams),
    {
      enabled: !selectedDate,
    },
  );

  useHotkeys(
    "arrowRight",
    () => handleMonthChange(1, new TZDate(currentDate, "UTC"), setParams),
    {
      enabled: !selectedDate,
    },
  );

  const ref = useClickAway<HTMLDivElement>(() => {
    if (range?.length === 1) setParams({ range: null });
  });

  const handleMouseDown = (date: TZDate) => {
    setIsDragging(true);
    setLocalRange([formatISO(date, { representation: "date" }), null]);
  };

  const handleMouseEnter = (date: TZDate) => {
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
      let start = new TZDate(localRange[0], "UTC");
      let end = new TZDate(localRange[1], "UTC");
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
          currentDate={new TZDate(currentDate, "UTC")}
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

function handleMonthChange(
  direction: number,
  currentDate: TZDate,
  setParams: (params: any) => void,
) {
  const newDate =
    direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
  setParams({
    date: formatISO(newDate, { representation: "date" }),
  });
}

type CalendarHeaderProps = {
  meta: { totalDuration?: number };
  data: Record<string, TrackerEvent[]>;
};

function CalendarHeader({ meta, data }: CalendarHeaderProps) {
  const { locale } = useUserContext((state) => state.data);

  const projectTotals = Object.entries(data).reduce(
    (acc, [_, events]) => {
      for (const event of events) {
        const projectName = event.project?.name;
        if (projectName) {
          if (!acc[projectName]) {
            acc[projectName] = {
              duration: 0,
              amount: 0,
              currency: event.project.currency,
              rate: event.project.rate,
            };
          }
          const project = acc[projectName];
          project.duration += event.duration;
          project.amount = (project.duration / 3600) * project.rate;
        }
      }
      return acc;
    },
    {} as Record<
      string,
      { duration: number; amount: number; currency: string; rate: number }
    >,
  );

  const sortedProjects = Object.entries(projectTotals)
    .sort(([, a], [, b]) => b.duration - a.duration)
    .map(([name, { duration, amount, currency }]) => ({
      name,
      duration,
      amount,
      currency,
    }));

  const mostUsedCurrency = Object.values(projectTotals).reduce(
    (acc, { currency }) => {
      if (currency !== null) {
        acc[currency] = (acc[currency] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const dominantCurrency =
    Object.entries(mostUsedCurrency).length > 0
      ? Object.entries(mostUsedCurrency).reduce((a, b) =>
          a[1] > b[1] ? a : b,
        )[0]
      : null;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2 select-text">
        <h1 className="text-4xl font-mono">
          <NumberFlow
            value={
              meta?.totalDuration ? Math.round(meta.totalDuration / 3600) : 0
            }
          />
          <span className="relative">h</span>
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">
            {dominantCurrency
              ? `${formatAmount({
                  currency: dominantCurrency,
                  amount: meta?.totalAmount,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  locale,
                })} this month`
              : "Nothing billable yet"}
          </p>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <Icons.Info className="h-4 w-4 mt-1" />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs text-[#878787] w-[250px] p-0 dark:bg-background"
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

                        <div className="flex space-x-2 items-center">
                          <span className="text-primary text-xs">
                            {secondsToHoursAndMinutes(project.duration)}
                          </span>
                          <span className="text-primary text-xs">
                            {formatAmount({
                              currency: project.currency,
                              amount: project.amount,
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                              locale,
                            })}
                          </span>
                        </div>
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
      </div>
    </div>
  );
}

type CalendarGridProps = {
  firstWeek: TZDate[];
  calendarDays: TZDate[];
  currentDate: TZDate;
  selectedDate: string;
  data: Record<string, TrackerEvent[]>;
  range: [string, string] | null;
  localRange: [string, string | null];
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
  selectedDate: string;
  data: Record<string, TrackerEvent[]>;
  range: [string, string] | null;
  localRange: [string, string | null];
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
      <TrackerEvents data={data[formattedDate]} isToday={isToday(date)} />
    </div>
  );
}

function checkIsInRange(
  date: TZDate,
  isDragging: boolean,
  localRange: [string, string | null],
  range: [string, string] | null,
) {
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = new TZDate(localRange[1], "UTC");
    return (
      date >= new TZDate(Math.min(start.getTime(), end.getTime()), "UTC") &&
      date <= new TZDate(Math.max(start.getTime(), end.getTime()), "UTC")
    );
  }
  if (range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    return (
      date >= new TZDate(Math.min(start.getTime(), end.getTime()), "UTC") &&
      date <= new TZDate(Math.max(start.getTime(), end.getTime()), "UTC")
    );
  }
  return false;
}

function checkIsFirstSelectedDate(
  date: TZDate,
  isDragging: boolean,
  localRange: [string, string | null],
  range: [string, string] | null,
) {
  if (isDragging && localRange[0]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = localRange[1] ? new TZDate(localRange[1], "UTC") : start;
    const firstDate = new TZDate(
      Math.min(start.getTime(), end.getTime()),
      "UTC",
    );
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(firstDate, { representation: "date" })
    );
  }
  if (range && range.length > 0) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const firstDate = new TZDate(
      Math.min(start.getTime(), end.getTime()),
      "UTC",
    );
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(firstDate, { representation: "date" })
    );
  }
  return false;
}

function checkIsLastSelectedDate(
  date: TZDate,
  isDragging: boolean,
  localRange: [string, string | null],
  range: [string, string] | null,
) {
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = new TZDate(localRange[1], "UTC");
    const lastDate = new TZDate(
      Math.max(start.getTime(), end.getTime()),
      "UTC",
    );
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(lastDate, { representation: "date" })
    );
  }
  if (range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const lastDate = new TZDate(
      Math.max(start.getTime(), end.getTime()),
      "UTC",
    );
    return (
      formatISO(date, { representation: "date" }) ===
      formatISO(lastDate, { representation: "date" })
    );
  }
  return false;
}
