import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  addMinutes,
  addSeconds,
  differenceInSeconds,
  eachDayOfInterval,
  format,
  isValid,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";

export const NEW_EVENT_ID = "new-event";

// API Response type from the router
type ApiTrackerRecord =
  RouterOutputs["trackerEntries"]["byDate"]["data"][number];

// Internal tracker record type with consistent Date handling
export interface TrackerRecord {
  id: string;
  date: string | null;
  description: string | null;
  duration: number | null;
  start: Date;
  stop: Date;
  user: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  trackerProject: {
    id: string;
    name: string;
    currency: string | null;
    rate: number | null;
    customer: {
      id: string;
      name: string;
    } | null;
  } | null;
}

// Date utility functions
export const createSafeDate = (
  dateInput: string | Date | null | undefined,
  fallback?: Date,
): Date => {
  if (!dateInput) return fallback || new Date();

  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  return isValid(date) ? date : fallback || new Date();
};

export const formatTimeFromDate = (date: Date | string | null): string => {
  const safeDate = createSafeDate(date);
  return format(safeDate, "HH:mm");
};

export const getSlotFromDate = (date: Date | string | null): number => {
  const safeDate = createSafeDate(date);
  return safeDate.getHours() * 4 + Math.floor(safeDate.getMinutes() / 15);
};

export const calculateDuration = (
  start: Date | string | null,
  stop: Date | string | null,
): number => {
  const startDate = createSafeDate(start);
  const stopDate = createSafeDate(stop);
  return Math.max(0, differenceInSeconds(stopDate, startDate));
};

// Tracker record transformation
export const transformApiRecord = (
  apiRecord: ApiTrackerRecord,
  selectedDate: string | null,
): TrackerRecord => {
  const start = apiRecord.start
    ? parseISO(apiRecord.start)
    : parseISO(`${apiRecord.date || selectedDate}T09:00:00`);

  const stop = apiRecord.stop
    ? parseISO(apiRecord.stop)
    : addSeconds(start, apiRecord.duration || 0);

  return {
    id: apiRecord.id,
    date: apiRecord.date,
    description: apiRecord.description,
    duration: apiRecord.duration,
    start: isValid(start) ? start : new Date(),
    stop: isValid(stop)
      ? stop
      : addMinutes(isValid(start) ? start : new Date(), 15),
    user: apiRecord.user,
    trackerProject: apiRecord.trackerProject
      ? {
          id: apiRecord.trackerProject.id,
          name: apiRecord.trackerProject.name || "",
          currency: apiRecord.trackerProject.currency,
          rate: apiRecord.trackerProject.rate,
          customer: apiRecord.trackerProject.customer,
        }
      : null,
  };
};

export const createNewEvent = (
  slot: number,
  selectedProjectId: string | null,
  selectedDate?: string | null,
): TrackerRecord => {
  const baseDate = selectedDate ? parseISO(selectedDate) : new Date();
  const startDate = setMinutes(
    setHours(baseDate, Math.floor(slot / 4)),
    (slot % 4) * 15,
  );
  const endDate = addMinutes(startDate, 15);

  return {
    id: NEW_EVENT_ID,
    date: format(startDate, "yyyy-MM-dd"),
    description: null,
    duration: 15 * 60, // 15 minutes in seconds
    start: startDate,
    stop: endDate,
    user: null,
    trackerProject: selectedProjectId
      ? {
          id: selectedProjectId,
          name: "",
          currency: null,
          rate: null,
          customer: null,
        }
      : null,
  };
};

export const updateEventTime = (
  event: TrackerRecord,
  start: Date,
  stop: Date,
): TrackerRecord => {
  return {
    ...event,
    start: isValid(start) ? start : event.start,
    stop: isValid(stop) ? stop : event.stop,
    duration: calculateDuration(start, stop),
  };
};

// Date range utilities
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

// Validation utilities
export const isValidTimeSlot = (slot: number): boolean => {
  return slot >= 0 && slot < 96; // 24 hours * 4 slots per hour
};

export const isValidDateString = (dateStr: string): boolean => {
  return isValid(parseISO(dateStr));
};

// Form data conversion utilities
export const convertToFormData = (record: TrackerRecord) => {
  return {
    id: record.id === NEW_EVENT_ID ? undefined : record.id,
    start: formatTimeFromDate(record.start),
    stop: formatTimeFromDate(record.stop),
    projectId: record.trackerProject?.id || "",
    description: record.description || "",
    duration: calculateDuration(record.start, record.stop),
  };
};

export const convertFromFormData = (
  formData: {
    id?: string;
    start: string;
    stop: string;
    projectId: string;
    assignedId?: string;
    description?: string;
    duration: number;
  },
  baseDate: Date,
  dates: string[],
): {
  id?: string;
  start: string;
  stop: string;
  dates: string[];
  assignedId: string | null;
  projectId: string;
  description: string | null;
  duration: number;
} => {
  const startDate = parseISO(
    `${format(baseDate, "yyyy-MM-dd")}T${formData.start}:00`,
  );
  const stopDate = parseISO(
    `${format(baseDate, "yyyy-MM-dd")}T${formData.stop}:00`,
  );

  return {
    id: formData.id === NEW_EVENT_ID ? undefined : formData.id,
    start: startDate.toISOString(),
    stop: stopDate.toISOString(),
    dates,
    assignedId: formData.assignedId || null,
    projectId: formData.projectId,
    description: formData.description || null,
    duration: formData.duration,
  };
};

// Utility function to split cross-day entries for display
export function splitCrossDayForDisplay(
  entry: any, // Use any to handle API data structure
  selectedDate: string,
): any[] {
  const startDate = createSafeDate(entry.start);
  const stopDate = createSafeDate(entry.stop);

  // Check if entry spans multiple days using LOCAL time boundaries
  const startDateLocal = new Date(
    startDate.getTime() - startDate.getTimezoneOffset() * 60000,
  );
  const stopDateLocal = new Date(
    stopDate.getTime() - stopDate.getTimezoneOffset() * 60000,
  );

  const startDay = startDateLocal.toISOString().split("T")[0];
  const stopDay = stopDateLocal.toISOString().split("T")[0];
  const selectedDay = selectedDate;

  // If it's not cross-day, return as-is
  if (startDay === stopDay) {
    return [entry];
  }

  // If entry doesn't involve the selected date, return as-is
  if (selectedDay !== startDay && selectedDay !== stopDay) {
    return [entry];
  }

  // For first day (start day)
  if (selectedDay === startDay) {
    // Find midnight at the end of the selected day in local timezone
    // new Date(selectedDate) already creates midnight in LOCAL time
    // and toISOString() shows the correct UTC equivalent
    const nextDayMidnightUTC = new Date(selectedDate);
    nextDayMidnightUTC.setDate(nextDayMidnightUTC.getDate() + 1);
    nextDayMidnightUTC.setHours(0, 0, 0, 0);

    const durationUntilMidnight = Math.floor(
      (nextDayMidnightUTC.getTime() - startDate.getTime()) / 1000,
    );

    return [
      {
        ...entry,
        stop: nextDayMidnightUTC.toISOString(),
        duration: Math.max(0, durationUntilMidnight),
      },
    ];
  }

  // For second day (stop day)
  if (selectedDay === stopDay) {
    // Find midnight at the start of the selected day in local timezone
    // new Date(selectedDate) already creates midnight in LOCAL time
    // and toISOString() shows the correct UTC equivalent
    const dayMidnightUTC = new Date(selectedDate);
    dayMidnightUTC.setHours(0, 0, 0, 0);

    const durationFromMidnight = Math.floor(
      (stopDate.getTime() - dayMidnightUTC.getTime()) / 1000,
    );

    return [
      {
        ...entry,
        start: dayMidnightUTC.toISOString(),
        duration: Math.max(0, durationFromMidnight),
      },
    ];
  }

  return [entry];
}

// Check if an entry spans multiple days
export function isCrossDayEntry(entry: any): boolean {
  const startDate = createSafeDate(entry.start);
  const stopDate = createSafeDate(entry.stop);

  const startDay = startDate.toISOString().split("T")[0];
  const stopDay = stopDate.toISOString().split("T")[0];

  return startDay !== stopDay;
}
