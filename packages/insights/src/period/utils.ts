/**
 * Period date utilities for insights
 */
import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  getMonth,
  getQuarter,
  getYear,
  nextMonday,
  setISOWeek,
  setISOWeekYear,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns";
import type { PeriodInfo, PeriodType } from "../types";

/**
 * Get period info for the previous complete period
 * Used when generating insights (e.g., on Monday morning, generate for previous week)
 */
export function getPreviousCompletePeriod(
  periodType: PeriodType,
  referenceDate: Date = new Date(),
): PeriodInfo {
  switch (periodType) {
    case "weekly": {
      const lastWeekDate = subWeeks(referenceDate, 1);
      const start = startOfWeek(lastWeekDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(lastWeekDate, { weekStartsOn: 1 }); // Sunday
      const weekNumber = getISOWeek(start);
      const year = getYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `Week ${weekNumber}, ${year}`,
        periodYear: year,
        periodNumber: weekNumber,
      };
    }
    case "monthly": {
      const lastMonthDate = subMonths(referenceDate, 1);
      const start = startOfMonth(lastMonthDate);
      const end = endOfMonth(lastMonthDate);
      const monthNumber = getMonth(start) + 1; // 1-12
      const year = getYear(start);
      const monthName = format(start, "MMMM");
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${monthName} ${year}`,
        periodYear: year,
        periodNumber: monthNumber,
      };
    }
    case "quarterly": {
      const lastQuarterDate = subQuarters(referenceDate, 1);
      const start = startOfQuarter(lastQuarterDate);
      const end = endOfQuarter(lastQuarterDate);
      const quarterNumber = getQuarter(start);
      const year = getYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `Q${quarterNumber} ${year}`,
        periodYear: year,
        periodNumber: quarterNumber,
      };
    }
    case "yearly": {
      const lastYearDate = subYears(referenceDate, 1);
      const start = startOfYear(lastYearDate);
      const end = endOfYear(lastYearDate);
      const year = getYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${year} Year in Review`,
        periodYear: year,
        periodNumber: year,
      };
    }
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Get period info for a specific period
 */
export function getPeriodInfo(
  periodType: PeriodType,
  periodYear: number,
  periodNumber: number,
): PeriodInfo {
  switch (periodType) {
    case "weekly": {
      // Use ISO week functions to properly handle week numbering
      // ISO Week 1 is the week containing January 4th, not simply "first week of the year"
      // This correctly handles year boundaries (e.g., Week 1 of 2023 starts Jan 2, not Dec 26)
      const baseDate = new Date();
      const withYear = setISOWeekYear(baseDate, periodYear);
      const weekDate = setISOWeek(withYear, periodNumber);
      const start = startOfWeek(weekDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekDate, { weekStartsOn: 1 });
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `Week ${periodNumber}, ${periodYear}`,
        periodYear,
        periodNumber,
      };
    }
    case "monthly": {
      const start = new Date(periodYear, periodNumber - 1, 1);
      const end = endOfMonth(start);
      const monthName = format(start, "MMMM");
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${monthName} ${periodYear}`,
        periodYear,
        periodNumber,
      };
    }
    case "quarterly": {
      const monthOffset = (periodNumber - 1) * 3;
      const start = new Date(periodYear, monthOffset, 1);
      const end = endOfQuarter(start);
      return {
        periodStart: startOfQuarter(start),
        periodEnd: end,
        periodLabel: `Q${periodNumber} ${periodYear}`,
        periodYear,
        periodNumber,
      };
    }
    case "yearly": {
      const start = new Date(periodYear, 0, 1);
      const end = endOfYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${periodYear} Year in Review`,
        periodYear,
        periodNumber: periodYear,
      };
    }
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Get the period before the given period (for comparison)
 */
export function getPreviousPeriod(
  periodType: PeriodType,
  currentPeriod: PeriodInfo,
): PeriodInfo {
  // Pass periodStart directly - getPreviousCompletePeriod handles the subtraction internally
  return getPreviousCompletePeriod(periodType, currentPeriod.periodStart);
}

/**
 * Get a human-readable label for a period
 * Format: "Weekly Summary — November 10-16, 2024"
 *
 * @param periodType - weekly, monthly, quarterly, yearly
 * @param periodYear - The year (e.g., 2026)
 * @param periodNumber - Week 1-53, Month 1-12, Quarter 1-4, or year
 * @param locale - Optional locale for month names (default: en-US)
 */
export function getPeriodLabel(
  periodType: PeriodType,
  periodYear: number,
  periodNumber: number,
  locale = "en-US",
): string {
  const periodInfo = getPeriodInfo(periodType, periodYear, periodNumber);
  const { periodStart, periodEnd } = periodInfo;

  const formatMonth = (date: Date) =>
    date.toLocaleDateString(locale, { month: "long" });
  const startMonth = formatMonth(periodStart);
  const endMonth = formatMonth(periodEnd);
  const startDay = periodStart.getDate();
  const endDay = periodEnd.getDate();
  const endYear = periodEnd.getFullYear();

  switch (periodType) {
    case "weekly": {
      // Same month: "November 10-16, 2024"
      // Different months: "December 30 - January 5, 2025"
      const dateRange =
        startMonth === endMonth
          ? `${startMonth} ${startDay}-${endDay}, ${endYear}`
          : `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
      return `Weekly Summary — ${dateRange}`;
    }
    case "monthly":
      return `Monthly Summary — ${startMonth} ${endYear}`;
    case "quarterly":
      return `Quarterly Summary — Q${periodNumber} ${periodYear}`;
    case "yearly":
      return `Yearly Summary — ${periodYear}`;
    default:
      return `${periodType} ${periodNumber}, ${periodYear}`;
  }
}

/**
 * Format a date for database queries (YYYY-MM-DD)
 */
export function formatDateForQuery(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Format a date as ISO string for database storage
 */
export function formatDateForStorage(date: Date): string {
  return date.toISOString();
}

/**
 * Get the current period (not yet complete)
 */
export function getCurrentPeriod(
  periodType: PeriodType,
  referenceDate: Date = new Date(),
): PeriodInfo {
  switch (periodType) {
    case "weekly": {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
      const weekNumber = getISOWeek(start);
      const year = getYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `Week ${weekNumber}, ${year}`,
        periodYear: year,
        periodNumber: weekNumber,
      };
    }
    case "monthly": {
      const start = startOfMonth(referenceDate);
      const end = endOfMonth(referenceDate);
      const monthNumber = getMonth(start) + 1;
      const year = getYear(start);
      const monthName = format(start, "MMMM");
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${monthName} ${year}`,
        periodYear: year,
        periodNumber: monthNumber,
      };
    }
    case "quarterly": {
      const start = startOfQuarter(referenceDate);
      const end = endOfQuarter(referenceDate);
      const quarterNumber = getQuarter(start);
      const year = getYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `Q${quarterNumber} ${year}`,
        periodYear: year,
        periodNumber: quarterNumber,
      };
    }
    case "yearly": {
      const start = startOfYear(referenceDate);
      const end = endOfYear(referenceDate);
      const year = getYear(start);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${year}`,
        periodYear: year,
        periodNumber: year,
      };
    }
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/** Default hour for insights delivery (7 AM) */
export const DEFAULT_INSIGHT_HOUR = 7;

/**
 * Calculate the next scheduled time for insight generation.
 *
 * Schedules insights to be delivered at a specific local time (default 7 AM).
 * - Weekly: Next Monday at target hour
 * - Monthly: 1st of next month at target hour
 * - Quarterly: 1st of next quarter at target hour
 * - Yearly: January 1st at target hour
 *
 * @param periodType - Type of period (weekly, monthly, quarterly, yearly)
 * @param timezone - IANA timezone string (e.g., "Europe/Stockholm")
 * @param targetHour - Hour in local time to deliver (0-23, default 7)
 * @param referenceDate - Reference date to calculate from (default: now)
 * @returns Date object representing the next scheduled time in UTC
 */
export function calculateNextInsightTime(
  periodType: PeriodType,
  timezone = "UTC",
  targetHour: number = DEFAULT_INSIGHT_HOUR,
  referenceDate: Date = new Date(),
): Date {
  // Get the next period boundary
  let nextDate: Date;

  switch (periodType) {
    case "weekly": {
      // Next Monday
      nextDate = nextMonday(referenceDate);
      break;
    }
    case "monthly": {
      // 1st of next month
      const nextMonth = addMonths(startOfMonth(referenceDate), 1);
      nextDate = nextMonth;
      break;
    }
    case "quarterly": {
      // 1st of next quarter
      const currentQuarter = getQuarter(referenceDate);
      const currentYear = getYear(referenceDate);

      if (currentQuarter === 4) {
        // Next quarter is Q1 of next year
        nextDate = new Date(currentYear + 1, 0, 1);
      } else {
        // Next quarter starts at month (currentQuarter * 3)
        nextDate = new Date(currentYear, currentQuarter * 3, 1);
      }
      break;
    }
    case "yearly": {
      // January 1st of next year
      const year = getYear(referenceDate);
      nextDate = new Date(year + 1, 0, 1);
      break;
    }
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }

  // Set the target hour in the specified timezone
  // We create a date string in the target timezone and parse it back to UTC
  return setHourInTimezone(nextDate, targetHour, timezone);
}

/**
 * Set a specific hour in a given timezone and return as UTC Date.
 *
 * @param date - Base date (only year, month, day are used)
 * @param hour - Target hour (0-23) in the specified timezone
 * @param timezone - IANA timezone string
 * @returns Date object representing that moment in UTC
 */
function setHourInTimezone(date: Date, hour: number, timezone: string): Date {
  // Format the date components we need
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hourStr = String(hour).padStart(2, "0");

  // Create an ISO string for that local time
  // We'll use the timezone-aware Date constructor behavior
  const localDateStr = `${year}-${month}-${day}T${hourStr}:00:00`;

  // Use Intl to get the UTC offset for this specific datetime in the timezone
  try {
    // Create a temporary date to get the offset
    const tempDate = new Date(localDateStr);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Get parts in the target timezone
    const parts = formatter.formatToParts(tempDate);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "0";

    // The current UTC time formatted in target timezone
    const _tzYear = Number.parseInt(getPart("year"), 10);
    const _tzMonth = Number.parseInt(getPart("month"), 10);
    const _tzDay = Number.parseInt(getPart("day"), 10);
    const _tzHour = Number.parseInt(getPart("hour"), 10);

    // Calculate the offset: what UTC time gives us the target local time?
    // We need to find UTC time such that when converted to timezone, it equals our target
    // Start with a guess and adjust
    const targetUtc = new Date(
      Date.UTC(year, date.getMonth(), date.getDate(), hour, 0, 0),
    );

    // Check what local time this UTC gives us
    const checkParts = formatter.formatToParts(targetUtc);
    const checkHour = Number.parseInt(
      checkParts.find((p) => p.type === "hour")?.value ?? "0",
      10,
    );
    const checkDay = Number.parseInt(
      checkParts.find((p) => p.type === "day")?.value ?? "0",
      10,
    );

    // Calculate hour difference
    let hourDiff = checkHour - hour;
    const dayDiff = checkDay - date.getDate();

    // Adjust for day boundary
    if (dayDiff > 0) hourDiff += 24;
    if (dayDiff < 0) hourDiff -= 24;

    // Adjust UTC time to compensate
    const adjustedUtc = new Date(
      targetUtc.getTime() - hourDiff * 60 * 60 * 1000,
    );

    return adjustedUtc;
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Date(
      Date.UTC(year, date.getMonth(), date.getDate(), hour, 0, 0),
    );
  }
}

/**
 * Get the initial next_at time for a newly enabled team.
 * If we're past the delivery time today, schedule for the next occurrence.
 *
 * @param periodType - Type of period
 * @param timezone - Team's timezone
 * @param targetHour - Target delivery hour
 */
export function getInitialInsightSchedule(
  periodType: PeriodType,
  timezone = "UTC",
  targetHour: number = DEFAULT_INSIGHT_HOUR,
): Date {
  const now = new Date();

  // Calculate next occurrence
  const nextTime = calculateNextInsightTime(
    periodType,
    timezone,
    targetHour,
    now,
  );

  // If the next time is in the past (shouldn't happen normally), add one period
  if (nextTime <= now) {
    // Recalculate from one period ahead
    let futureRef: Date;
    switch (periodType) {
      case "weekly":
        futureRef = addWeeks(now, 1);
        break;
      case "monthly":
        futureRef = addMonths(now, 1);
        break;
      case "quarterly":
        futureRef = addMonths(now, 3);
        break;
      case "yearly":
        futureRef = addYears(now, 1);
        break;
      default:
        futureRef = addWeeks(now, 1);
    }
    return calculateNextInsightTime(
      periodType,
      timezone,
      targetHour,
      futureRef,
    );
  }

  return nextTime;
}
