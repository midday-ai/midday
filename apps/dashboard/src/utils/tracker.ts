import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  addMinutes,
  addSeconds,
  eachDayOfInterval,
  format,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";

export const NEW_EVENT_ID = "new-event";

type TrackerRecord = RouterOutputs["trackerEntries"]["byDate"]["data"][number];

export function sortDates(dates: string[]) {
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

export function getTrackerDates(
  range: string[] | null,
  selectedDate: string | null,
): Date[] {
  if (range) {
    return sortDates(range).map((dateString) => new Date(dateString));
  }

  if (selectedDate) {
    return [new Date(selectedDate)];
  }

  return [new Date()];
}

export const formatHour = (hour: number, timeFormat?: number | null) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return format(date, timeFormat === 12 ? "hh:mm a" : "HH:mm");
};

export const getTimeFromDate = (date: Date) => {
  return format(date, "HH:mm");
};

export const getSlotFromDate = (date: Date) => {
  return date.getHours() * 4 + Math.floor(date.getMinutes() / 15);
};

export const createNewEvent = (
  slot: number,
  selectedProjectId: string | null,
): TrackerRecord => {
  const startDate = setMinutes(
    setHours(new Date(), Math.floor(slot / 4)),
    (slot % 4) * 15,
  );
  const endDate = addMinutes(startDate, 15);
  return {
    id: NEW_EVENT_ID,
    date: format(startDate, "yyyy-MM-dd"),
    description: null,
    duration: 15 * 60, // 15 minutes in seconds
    start: startDate.toISOString(),
    stop: endDate.toISOString(),
    user: null,
    trackerProject: {
      id: selectedProjectId ?? "",
      name: "",
      currency: null,
      rate: null,
      customer: null,
    },
  };
};

export const updateEventTime = (
  event: TrackerRecord,
  start: Date,
  end: Date,
): TrackerRecord => {
  return { ...event, start: start.toISOString(), stop: end.toISOString() };
};

export const getDates = (
  selectedDate: string | null,
  sortedRange: string[] | null,
): string[] => {
  if (selectedDate) return [selectedDate];
  if (sortedRange && sortedRange.length === 2) {
    const [start, end] = sortedRange;
    if (start && end) {
      return eachDayOfInterval({
        start: parseISO(start),
        end: parseISO(end),
      }).map((date) => format(date, "yyyy-MM-dd"));
    }
  }
  return [];
};

export const transformTrackerData = (
  event: TrackerRecord,
  selectedDate: string | null,
): TrackerRecord => {
  const start = event.start
    ? parseISO(event.start)
    : parseISO(`${event.date || selectedDate}T09:00:00`);
  const stop = event.stop
    ? parseISO(event.stop)
    : addSeconds(start, event.duration || 0);

  return {
    ...event,
    id: event.id,
    start: start.toISOString(),
    stop: stop.toISOString(),
    trackerProject: {
      id: event.trackerProject?.id!,
      name: event.trackerProject?.name || "",
      currency: event.trackerProject?.currency ?? null,
      rate: event.trackerProject?.rate ?? null,
      customer: event.trackerProject?.customer ?? null,
    },
    description: event.description,
  };
};
