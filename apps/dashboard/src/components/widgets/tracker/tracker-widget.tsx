"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
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
};

export function TrackerWidget({ date: initialDate, meta, data }: Props) {
  const {
    date: currentDate,
    setParams,
    projectId,
  } = useTrackerParams(initialDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const firstWeek = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, { weekStartsOn: 1 }),
  });

  const hasEvent = (date: Date) => {
    // This is a placeholder. In a real app, you'd check against actual event data.
    return [8, 11, 18, 21, 23].includes(date.getDate());
  };

  return (
    <div>
      <TrackerHeader totalDuration={meta?.totalDuration} date={currentDate} />

      <div className="mt-8">
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
            return (
              <button
                type="button"
                onClick={() =>
                  setParams({
                    day: formatISO(date, { representation: "date" }),
                    projectId,
                  })
                }
                key={index.toString()}
                className={`pt-2 pb-5 px-3 font-mono text-sm relative ${
                  !isCurrentMonth
                    ? "bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]"
                    : isToday(date)
                      ? "bg-[#202020]"
                      : "bg-background"
                }`}
              >
                <div>{format(date, "d")}</div>

                {hasEvent(date) && <TrackerIndicator count={1} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
