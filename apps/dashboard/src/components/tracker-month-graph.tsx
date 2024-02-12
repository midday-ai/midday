"use client";

import { useTrackerStore } from "@/store/tracker";
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { TrackerDayCard } from "./tracker-day-card";

export function TrackerMonthGraph({
  date,
  onSelect,
  data,
  showCurrentDate,
  projectId,
  disableHover,
  disableButton,
}) {
  const weekStartsOn = 1;
  const { isTracking } = useTrackerStore();
  const currentDate = new Date(date);

  const weeks = eachWeekOfInterval(
    {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    },
    { weekStartsOn }
  );

  const firstDay = startOfMonth(new Date());
  const lastDay = endOfMonth(new Date());

  const handleOnSelect = (params) => {
    if (onSelect) {
      onSelect({
        projectId: params.id || projectId,
        date: formatISO(params.date, { representation: "date" }),
      });
    }
  };

  const rows = weeks.map((day) => {
    const daysInWeek = eachDayOfInterval({
      start: startOfWeek(day, { weekStartsOn }),
      end: endOfWeek(day, { weekStartsOn }),
    });

    return daysInWeek.map((dayInWeek) => {
      const isoDate = formatISO(dayInWeek, { representation: "date" });

      return (
        <TrackerDayCard
          key={isoDate}
          date={dayInWeek}
          data={data && data[isoDate]}
          disableHover={disableHover}
          disableButton={disableButton}
          onSelect={handleOnSelect}
          isActive={
            showCurrentDate && isSameDay(new Date(dayInWeek), currentDate)
          }
          isTracking={isTracking && isSameDay(new Date(dayInWeek), new Date())}
          outOfRange={
            isBefore(dayInWeek, firstDay) || isAfter(dayInWeek, lastDay)
          }
        />
      );
    });
  });

  return <div className="grid gap-9 rid grid-cols-7">{rows}</div>;
}
