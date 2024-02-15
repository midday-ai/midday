"use client";

import { secondsToHoursAndMinutes } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getTrackerRecordsByRange } from "@midday/supabase/queries";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
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
import { useEffect, useState } from "react";
import { TrackerDayCard } from "./tracker-day-card";
import { TrackerPagination } from "./tracker-pagination";

export function TrackerGraph() {
  const [data, setData] = useState();
  const [meta, setMeta] = useState();
  const weekStartsOn = 1; // TODO: Monday - should be user setting
  const numberOfMonths = 6;
  const supabase = createClient();
  const currentDate = new Date();

  const [params, setParams] = useQueryStates(
    {
      date: parseAsString,
      projectId: parseAsString,
      from: parseAsString.withDefault(
        formatISO(startOfMonth(subMonths(currentDate, numberOfMonths)), {
          representation: "date",
        })
      ),
      to: parseAsString.withDefault(
        formatISO(endOfMonth(currentDate), {
          representation: "date",
        })
      ),
    },
    {
      shallow: true,
    }
  );

  async function fetchData() {
    const { data, meta } = await getTrackerRecordsByRange(supabase, {
      from: params.from,
      to: params.to,
      teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890", // TODO: Fix
    });

    setData(data);
    setMeta(meta);
  }

  useEffect(() => {
    if (!data) {
      fetchData();
    }
  }, [data]);

  useEffect(() => {
    if (meta && meta?.from !== params.from) {
      fetchData();
    }
  }, [params.from, params.to, meta]);

  const onSelect = (params) => {
    setParams(params);
  };

  const onChangePeriod = ({ from, to }) => {
    setParams({
      from,
      to,
    });
  };

  const weeks = eachWeekOfInterval(
    {
      start: params.from,
      end: params.to,
    },
    { weekStartsOn }
  );

  const months = eachMonthOfInterval({
    start: params.from,
    end: params.to,
  });

  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn }),
    end: lastDayOfWeek(currentDate, { weekStartsOn }),
  }).map((day) => format(day, "iii"));

  const isTracking = false;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mt-8">
        <div>
          <h2 className="font-medium text-[#878787] text-xl mb-2">
            Total hours
          </h2>
          <div className="text-[#F5F5F3] text-4xl">
            {secondsToHoursAndMinutes(meta?.totalDuration)}
          </div>
        </div>

        <TrackerPagination
          numberOfMonths={numberOfMonths}
          onChange={onChangePeriod}
          startDate={params.from}
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
                      isTracking={
                        isTracking &&
                        isSameDay(new Date(dayInWeek), currentDate)
                      }
                      outOfRange={
                        isBefore(dayInWeek, params.from) ||
                        isAfter(dayInWeek, params.to)
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
