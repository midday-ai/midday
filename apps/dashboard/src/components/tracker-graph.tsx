"use client";

import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isAfter,
  isBefore,
  isSameDay,
  lastDayOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { TrackerDayCard } from "./tracker-day-card";

export function TrackerGraph({ data }) {
  const weekStartsOn = 1; // Monday

  const [params, setParams] = useQueryStates(
    {
      date: parseAsString,
      projectId: parseAsString,
    },
    {
      shallow: true,
    }
  );

  const onSelect = (params) => {
    setParams(params);
  };

  const currentDate = new Date();
  const firstDay = startOfMonth(subMonths(currentDate, 6));
  const lastDay = endOfMonth(currentDate);

  const weeks = eachWeekOfInterval(
    {
      start: startOfMonth(subMonths(currentDate, 6)),
      end: endOfMonth(currentDate),
    },
    { weekStartsOn }
  );

  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn }),
    end: lastDayOfWeek(currentDate, { weekStartsOn }),
  }).map((day) => format(day, "iii"));

  const isTracking = false;

  return (
    <div className="w-full">
      <div className="mt-8">
        <h2 className="font-medium text-[#878787] text-xl mb-2">Total hours</h2>
        <div className="text-[#F5F5F3] text-4xl">294</div>
      </div>

      <div className="flex gap-4 mt-8">
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
                      key={isoDate}
                      date={isoDate}
                      data={data && data[isoDate]}
                      onSelect={onSelect}
                      isTracking={
                        isTracking &&
                        isSameDay(new Date(dayInWeek), currentDate)
                      }
                      outOfRange={
                        isBefore(dayInWeek, firstDay) ||
                        isAfter(dayInWeek, lastDay)
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
