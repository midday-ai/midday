/**
 * Period date utilities for insights
 */
import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  getMonth,
  getQuarter,
  getYear,
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
      // Create a date in the given week
      const jan1 = new Date(periodYear, 0, 1);
      const daysOffset = (periodNumber - 1) * 7;
      const weekDate = new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000);
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
  switch (periodType) {
    case "weekly":
      return getPreviousCompletePeriod("weekly", subWeeks(currentPeriod.periodStart, 1));
    case "monthly":
      return getPreviousCompletePeriod("monthly", subMonths(currentPeriod.periodStart, 1));
    case "quarterly":
      return getPreviousCompletePeriod("quarterly", subQuarters(currentPeriod.periodStart, 1));
    case "yearly":
      return getPreviousCompletePeriod("yearly", subYears(currentPeriod.periodStart, 1));
    default:
      throw new Error(`Unknown period type: ${periodType}`);
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
