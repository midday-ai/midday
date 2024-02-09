"use client";

import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  lastDayOfWeek,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";

export function TrackerGraph({ data }) {
  const weekStartsOn = 1; // Monday

  const [params, setParams] = useQueryStates(
    {
      date: parseAsString,
      id: parseAsString,
    },
    {
      shallow: true,
    }
  );

  const onSelect = (params) => {
    setParams(params);
  };

  const firstDay = startOfMonth(subMonths(new Date(), 6));
  const lastDay = endOfMonth(new Date());

  const weeks = eachWeekOfInterval(
    {
      start: startOfMonth(subMonths(new Date(), 6)),
      end: endOfMonth(new Date()),
    },
    { weekStartsOn }
  );

  const days = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn }),
    end: lastDayOfWeek(new Date(), { weekStartsOn }),
  }).map((day) => format(day, "iii"));

  return (
    <div>
      <div className="mt-8">
        <h2 className="font-medium text-[#878787] text-xl mb-2">Total hours</h2>
        <div className="text-[#F5F5F3] text-4xl">294</div>
      </div>

      <div className="flex gap-5 mt-8">
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
              <div className="flex flex-col gap-5">
                {daysInWeek.map((dayInWeek) => {
                  if (
                    isBefore(dayInWeek, firstDay) ||
                    isAfter(dayInWeek, lastDay)
                  ) {
                    return (
                      <time
                        key={dayInWeek.toISOString()}
                        dateTime={dayInWeek.toISOString()}
                        className="w-[28px] h-[28px] rounded-full border flex items-center justify-center border-transparent group-hover:border-white transition-colors"
                      >
                        <div className="w-[20px] h-[20px] rounded-full bg-[#878787]/10 group-hover:bg-white relative text-blue-500">
                          {/* {format(dayInWeek, "EEEEE")} */}
                        </div>
                      </time>
                    );
                  }

                  return (
                    <time
                      key={dayInWeek.toISOString()}
                      dateTime={dayInWeek.toISOString()}
                      className="w-[28px] h-[28px] rounded-full border flex items-center justify-center border-transparent group-hover:border-white transition-colors"
                    >
                      <div className="w-[20px] h-[20px] rounded-full bg-[#878787]/30 group-hover:bg-white relative">
                        {/* {format(dayInWeek, "EEEEE")} */}
                      </div>
                    </time>
                  );
                })}

                {/* {index % 4 === 0 && (
                  <div className="flex justify-center">
                    <span>katt</span>
                  </div>
                )} */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
