"use client";

import { TrackerDayCard } from "@/components/tracker-day-card";
import { TrackerPagination } from "@/components/tracker-pagination";
import { secondsToHoursAndMinutes } from "@/utils/format";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  formatISO,
  isAfter,
  isBefore,
  isSameDay,
  lastDayOfWeek,
  startOfWeek,
} from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";

export function TrackerGraph({
  data,
  start,
  end,
  meta,
  date,
  numberOfMonths,
  isTracking,
  projectId,
}) {
  const weekStartsOn = 1; // TODO: Monday - should be user setting

  const [params, setParams] = useQueryStates(
    {
      date: parseAsString.withDefault(date),
      day: parseAsString,
      projectId: parseAsString,
    },
    {
      shallow: true,
    }
  );

  const onSelect = (params) => {
    setParams(params);
  };

  const onChangeDate = (date: string) => {
    setParams({ date }, { shallow: false });
  };

  const weeks = eachWeekOfInterval(
    {
      start,
      end,
    },
    { weekStartsOn }
  );

  const months = eachMonthOfInterval({
    start,
    end,
  });

  const days = eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn }),
    end: lastDayOfWeek(date, { weekStartsOn }),
  }).map((day) => format(day, "iii"));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mt-8">
        <div>
          <h2 className="font-medium text-[#707070] dark:text-[#878787] text-xl mb-2">
            Total hours
          </h2>
          <div className="text-[#121212] dark:text-[#F5F5F3] text-4xl">
            {secondsToHoursAndMinutes(meta?.totalDuration)}
          </div>
        </div>

        <TrackerPagination
          numberOfMonths={numberOfMonths}
          onChange={onChangeDate}
          startDate={params.date}
        />
      </div>

      <div className="flex gap-2 mt-8 justify-between">
        <div className="flex flex-col justify-between mr-4">
          {days.map((day) => (
            <div className="h-[28px]" key={day}>
              <span className="text-xs text-[#878787]">{day}</span>
            </div>
          ))}
        </div>

        {weeks.map((day) => {
          const daysInWeek = eachDayOfInterval({
            start: startOfWeek(day, { weekStartsOn }),
            end: endOfWeek(day, { weekStartsOn }),
          });

          return (
            <div key={day.toISOString()}>
              <div className="flex flex-col gap-6">
                {daysInWeek.map((dayInWeek) => {
                  const isoDate = formatISO(dayInWeek, {
                    representation: "date",
                  });

                  return (
                    <TrackerDayCard
                      selectProject
                      key={isoDate}
                      date={isoDate}
                      data={data && data[isoDate]}
                      onSelect={onSelect}
                      projectId={projectId}
                      isTracking={
                        isTracking && isSameDay(new Date(dayInWeek), new Date())
                      }
                      outOfRange={
                        isBefore(dayInWeek, start) || isAfter(dayInWeek, end)
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex w-full mt-6 pl-10">
        {months.map((month) => (
          <div
            key={month.toDateString()}
            className="basis-1/6 text-center text-[#878787] text-sm"
          >
            {format(month, "MMM")}
          </div>
        ))}
      </div>
    </div>
  );
}
