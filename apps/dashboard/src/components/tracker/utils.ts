import { useTrackerParams } from "@/hooks/use-tracker-params";
import { TZDate } from "@date-fns/tz";
import { addMonths, formatISO, subMonths } from "date-fns";

export function handleMonthChange(direction: number, currentDate: TZDate) {
  const { setParams } = useTrackerParams();
  const newDate =
    direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
  setParams({
    date: formatISO(newDate, { representation: "date" }),
  });
}

export function checkIsInRange(
  date: TZDate,
  isDragging: boolean,
  localRange: [string | null, string | null],
  range: [string, string] | null,
): boolean {
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = new TZDate(localRange[1], "UTC");
    const minDate = new TZDate(Math.min(start.getTime(), end.getTime()), "UTC");
    const maxDate = new TZDate(Math.max(start.getTime(), end.getTime()), "UTC");
    return date > minDate && date < maxDate;
  }
  if (!isDragging && range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const minDate = new TZDate(Math.min(start.getTime(), end.getTime()), "UTC");
    const maxDate = new TZDate(Math.max(start.getTime(), end.getTime()), "UTC");
    return date > minDate && date < maxDate;
  }
  return false;
}

export function checkIsFirstSelectedDate(
  date: TZDate,
  isDragging: boolean,
  localRange: [string | null, string | null],
  range: [string, string] | null,
): boolean {
  const formattedDate = formatISO(date, { representation: "date" });
  if (isDragging && localRange[0]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = localRange[1] ? new TZDate(localRange[1], "UTC") : start;
    const firstDate = new TZDate(
      Math.min(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(firstDate, { representation: "date" });
  }
  if (!isDragging && range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const firstDate = new TZDate(
      Math.min(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(firstDate, { representation: "date" });
  }
  return false;
}

export function checkIsLastSelectedDate(
  date: TZDate,
  isDragging: boolean,
  localRange: [string | null, string | null],
  range: [string, string] | null,
): boolean {
  const formattedDate = formatISO(date, { representation: "date" });
  if (isDragging && localRange[0] && localRange[1]) {
    const start = new TZDate(localRange[0], "UTC");
    const end = new TZDate(localRange[1], "UTC");
    const lastDate = new TZDate(
      Math.max(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(lastDate, { representation: "date" });
  }
  if (!isDragging && range && range.length === 2) {
    const start = new TZDate(range[0], "UTC");
    const end = new TZDate(range[1], "UTC");
    const lastDate = new TZDate(
      Math.max(start.getTime(), end.getTime()),
      "UTC",
    );
    return formattedDate === formatISO(lastDate, { representation: "date" });
  }
  return false;
}
