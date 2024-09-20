"use client";

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { sortDates } from "@/utils/tracker";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRangeQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
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
import { useEffect, useState } from "react";
import { isHotkeyPressed, useHotkeys } from "react-hotkeys-hook";
import { TrackerEvents } from "./tracker-events";
import { TrackerMonthSelect } from "./tracker-month-select";

type TrackerMeta = {
  totalDuration?: number;
};

type TrackerRecord = {
  id: string;
  duration: number;
  date: string;
};

export function TrackerCalendar() {
  const {
    date: currentDate,
    range,
    setParams,
    selectedDate,
  } = useTrackerParams();

  const supabase = createClient();
  const [data, setData] = useState();
  const [meta, setMeta] = useState();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);

  useEffect(() => {
    async function fetchData() {
      const trackerData = await getTrackerRecordsByRangeQuery(supabase, {
        teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
        from: formatISO(start, {
          representation: "date",
        }),
        to: formatISO(end, {
          representation: "date",
        }),
      });

      setData(trackerData?.data);
      setMeta(trackerData?.meta);
    }

    fetchData();
  }, [currentDate]);

  const sortedDates = sortDates(range ?? []);

  useHotkeys("arrowLeft", () => {
    setParams({
      date: formatISO(subMonths(new Date(currentDate), 1), {
        representation: "date",
      }),
    });
  });

  useHotkeys("arrowRight", () => {
    setParams({
      date: formatISO(addMonths(new Date(currentDate), 1), {
        representation: "date",
      }),
    });
  });

  const firstWeek = eachDayOfInterval({
    start: calendarStart,
    end: endOfWeek(calendarStart, { weekStartsOn: 1 }),
  });

  const ref = useClickAway(() => {
    if (range?.length === 1) {
      setParams({ range: null });
    }
  });

  const getEventCount = (date: Date) => {
    return data?.[formatISO(date, { representation: "date" })]?.length ?? 0;
  };

  const handleOnSelect = (date: Date) => {
    if (isHotkeyPressed("meta")) {
      if (!range) {
        setParams({ range: [formatISO(date, { representation: "date" })] });
      } else if (range?.length === 1) {
        setParams({
          range: [...range, formatISO(date, { representation: "date" })],
        });
      }
    } else {
      setParams({ selectedDate: formatISO(date, { representation: "date" }) });
    }
  };

  return (
    <div ref={ref}>
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-medium text-[#707070] dark:text-[#878787] text-xl mb-2">
              Total hours
            </h2>
            <div className="text-[#121212] dark:text-[#F5F5F3] text-4xl">
              <MotionNumber
                value={meta?.totalDuration ? meta.totalDuration / 3600 : 0}
              />
              h
            </div>
          </div>

          <div className="flex space-x-2">
            <TrackerMonthSelect dateFormat="MMMM" />

            <Button variant="outline" size="icon">
              <Icons.Tune size={16} />
            </Button>
          </div>
        </div>

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
              <div
                // onClick={() => handleOnSelect(date)}
                key={index.toString()}
                className={cn(
                  "pt-2 pb-10 px-3 font-mono text-lg relative transition-all duration-100 text-left flex space-x-2",
                  isCurrentMonth && isToday(date)
                    ? "bg-[#202020"
                    : "bg-background",
                  !isCurrentMonth &&
                    "bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]",
                  selectedDate ===
                    formatISO(date, { representation: "date" }) &&
                    "ring-1 ring-white",
                  (range?.includes(
                    formatISO(date, { representation: "date" }),
                  ) ||
                    (sortedDates.length === 2 &&
                      date >=
                        (sortedDates[0]
                          ? new Date(sortedDates[0])
                          : new Date()) &&
                      date <=
                        (sortedDates[1]
                          ? new Date(sortedDates[1])
                          : new Date()))) &&
                    "ring-1 ring-white",
                )}
              >
                <div>{format(date, "d")}</div>
                <TrackerEvents
                  data={data?.[formatISO(date, { representation: "date" })]}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
