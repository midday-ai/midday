import type { RouterOutputs } from "@api/trpc/routers/_app";
import { tz } from "@date-fns/tz";
import { UTCDate, utc } from "@date-fns/utc";
import {
  addDays,
  addMinutes,
  addSeconds,
  differenceInSeconds,
  eachDayOfInterval,
  format,
  isValid,
  parse,
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

/**
 * Creates a safe Date using UTCDate for better UTC handling
 */
export const createSafeDate = (
  dateInput: string | Date | null | undefined,
  fallback?: Date,
): Date => {
  if (!dateInput) return fallback || new UTCDate();

  if (typeof dateInput === "string") {
    // Handle PostgreSQL timestamp format: "2026-02-25 17:15:00+00"
    // Convert to ISO format: "2026-02-25T17:15:00.000Z"
    let isoString = dateInput;
    if (dateInput.includes(" ") && dateInput.includes("+")) {
      isoString = dateInput.replace(" ", "T").replace("+00", ".000Z");
    }

    try {
      // Use UTCDate for consistent UTC parsing
      const utcDate = utc(isoString);
      return new Date(utcDate.getTime());
    } catch (error) {
      // Fallback to regular parseISO
      const date = parseISO(isoString);
      return isValid(date) ? date : fallback || new UTCDate();
    }
  }

  return isValid(dateInput) ? dateInput : fallback || new UTCDate();
};

/**
 * Format time from date with optional timezone support
 */
export const formatTimeFromDate = (
  date: Date | string | null,
  timezone?: string,
): string => {
  const safeDate = createSafeDate(date);

  if (timezone && timezone !== "UTC") {
    try {
      const createTZDate = tz(timezone);
      const tzDate = createTZDate(safeDate);
      return format(tzDate, "HH:mm");
    } catch (error) {
      console.warn("Timezone formatting failed:", error);
    }
  }

  return format(safeDate, "HH:mm");
};

/**
 * Parse time with midnight crossing support using timezone-aware parsing
 */
export const parseTimeWithMidnightCrossing = (
  startTime: string,
  stopTime: string,
  baseDate: Date,
  timezone?: string,
): { start: Date; stop: Date; duration: number } => {
  if (timezone && timezone !== "UTC") {
    try {
      const createTZDate = tz(timezone);

      // Create timezone-aware base date
      const tzBaseDate = createTZDate(baseDate);

      // Parse times in the timezone context
      const startDate = parse(startTime, "HH:mm", tzBaseDate);
      let stopDate = parse(stopTime, "HH:mm", tzBaseDate);

      // If stop time is before start time, assume it's on the next day
      if (stopDate < startDate) {
        stopDate = addDays(stopDate, 1);
      }

      const duration = differenceInSeconds(stopDate, startDate);

      return {
        start: new Date(startDate.getTime()),
        stop: new Date(stopDate.getTime()),
        duration,
      };
    } catch (error) {
      console.warn("Timezone time parsing failed:", error);
    }
  }

  // Fallback to UTC parsing
  const startDate = parse(startTime, "HH:mm", baseDate);
  let stopDate = parse(stopTime, "HH:mm", baseDate);

  // If stop time is before start time, assume it's on the next day
  if (stopDate < startDate) {
    stopDate = addDays(stopDate, 1);
  }

  const duration = differenceInSeconds(stopDate, startDate);

  return { start: startDate, stop: stopDate, duration };
};

/**
 * Get slot from date with timezone support (already updated)
 */
export const getSlotFromDate = (
  date: Date | string | null,
  timezone?: string,
): number => {
  const safeDate = createSafeDate(date);

  if (timezone && timezone !== "UTC") {
    try {
      // Use tz() function to create timezone-aware date
      const createTZDate = tz(timezone);
      const tzDate = createTZDate(safeDate);

      return tzDate.getHours() * 4 + Math.floor(tzDate.getMinutes() / 15);
    } catch (error) {
      console.warn("TZDate slot calculation failed:", error);
      // Fallback to browser timezone
    }
  }

  // Fallback to browser timezone (for backward compatibility)
  return safeDate.getHours() * 4 + Math.floor(safeDate.getMinutes() / 15);
};

/**
 * Calculate duration between dates with timezone support
 */
export const calculateDuration = (
  start: Date | string | null,
  stop: Date | string | null,
): number => {
  const startDate = createSafeDate(start);
  const stopDate = createSafeDate(stop);

  // If stop is before start, assume stop is on the next day
  if (stopDate < startDate) {
    const nextDayStop = addDays(stopDate, 1);
    return differenceInSeconds(nextDayStop, startDate);
  }

  return differenceInSeconds(stopDate, startDate);
};

/**
 * Format hour with timezone support
 */
export const formatHour = (
  hour: number,
  timeFormat?: number | null,
  timezone?: string,
) => {
  const date = new UTCDate();
  date.setUTCHours(hour, 0, 0, 0);

  if (timezone && timezone !== "UTC") {
    try {
      const createTZDate = tz(timezone);
      const tzDate = createTZDate(date);
      return format(tzDate, timeFormat === 12 ? "hh:mm a" : "HH:mm");
    } catch (error) {
      console.warn("Timezone hour formatting failed:", error);
    }
  }

  return format(date, timeFormat === 12 ? "hh:mm a" : "HH:mm");
};

/**
 * Create new event with timezone-aware time creation
 */
export const createNewEvent = (
  slot: number,
  selectedProjectId: string | null,
  selectedDate?: string | null,
  timezone?: string,
): TrackerRecord => {
  const baseDate = selectedDate ? parseISO(selectedDate) : new UTCDate();

  if (timezone && timezone !== "UTC") {
    try {
      const createTZDate = tz(timezone);
      const tzBaseDate = createTZDate(baseDate);

      const startDate = setMinutes(
        setHours(tzBaseDate, Math.floor(slot / 4)),
        (slot % 4) * 15,
      );
      const endDate = addMinutes(startDate, 15);

      return {
        id: NEW_EVENT_ID,
        date: format(tzBaseDate, "yyyy-MM-dd"),
        description: null,
        duration: 15 * 60, // 15 minutes in seconds
        start: new Date(startDate.getTime()),
        stop: new Date(endDate.getTime()),
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
    } catch (error) {
      console.warn("Timezone event creation failed:", error);
    }
  }

  // Fallback to UTC creation
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
  timezone?: string, // Add timezone parameter
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
  const {
    start: startDate,
    stop: stopDate,
    duration,
  } = parseTimeWithMidnightCrossing(
    formData.start,
    formData.stop,
    baseDate,
    timezone,
  );

  return {
    id: formData.id === NEW_EVENT_ID ? undefined : formData.id,
    start: startDate.toISOString(),
    stop: stopDate.toISOString(),
    dates,
    assignedId: formData.assignedId || null,
    projectId: formData.projectId,
    description: formData.description || null,
    duration: duration,
  };
};
