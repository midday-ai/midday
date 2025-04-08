import { TZDate } from "@date-fns/tz";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function useCalendarDates(
  currentDate: TZDate,
  weekStartsOnMonday: boolean,
) {
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
