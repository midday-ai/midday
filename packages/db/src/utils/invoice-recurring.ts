import { tz } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  getDay,
  lastDayOfMonth,
  setDate,
  setDay,
} from "date-fns";

// Re-export canonical types from @midday/invoice
// This ensures a single source of truth for recurring invoice types
export type {
  InvoiceRecurringEndType,
  InvoiceRecurringFrequency,
  InvoiceRecurringStatus,
} from "@midday/invoice/recurring";

export {
  isDateInFutureUTC,
  RECURRING_END_TYPES,
  RECURRING_FREQUENCIES,
  RECURRING_STATUSES,
} from "@midday/invoice/recurring";

// Import types and utilities for local use
import {
  type InvoiceRecurringEndType,
  type InvoiceRecurringFrequency,
  isDateInFutureUTC,
} from "@midday/invoice/recurring";

export interface RecurringInvoiceParams {
  frequency: InvoiceRecurringFrequency;
  frequencyDay: number | null; // 0-6 for weekly (day of week), 1-31 for monthly_date
  frequencyWeek: number | null; // 1-5 for monthly_weekday (e.g., 1st, 2nd Friday)
  frequencyInterval: number | null; // For custom: every X days
  timezone: string;
}

export interface UpcomingInvoice {
  date: string; // ISO date string
  amount: number;
}

export interface UpcomingSummary {
  hasEndDate: boolean;
  totalCount: number | null;
  totalAmount: number | null;
  currency: string;
}

/**
 * Get the nth occurrence of a weekday in a given month
 * @param year - The year
 * @param month - The month (0-11)
 * @param dayOfWeek - The day of week (0 = Sunday, 6 = Saturday)
 * @param week - Which occurrence (1 = first, 2 = second, etc.)
 * @param timezone - The timezone to use for calculations
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  week: number,
  timezone: string,
): Date {
  const createTZDate = tz(timezone);
  // Start from the first day of the month
  let date = createTZDate(new Date(year, month, 1));

  // Find the first occurrence of the target weekday
  const currentDayOfWeek = getDay(date);
  const daysUntilTarget =
    dayOfWeek >= currentDayOfWeek
      ? dayOfWeek - currentDayOfWeek
      : 7 - (currentDayOfWeek - dayOfWeek);

  date = addDays(date, daysUntilTarget);

  // Add (week - 1) * 7 days to get to the nth occurrence
  date = addDays(date, (week - 1) * 7);

  return date;
}

/**
 * Calculate the next scheduled date for a recurring invoice.
 *
 * **Server-Side - Authoritative for Scheduling**
 *
 * This function handles proper timezone-aware date calculations using `@date-fns/tz`.
 * It should be used for all actual invoice scheduling operations.
 *
 * Note: There is a similar `getNextDate` function in `@midday/invoice/recurring`
 * that provides simplified client-side calculations for UI preview purposes only.
 * That version does NOT handle timezones and should not be used for scheduling.
 *
 * @param params - Recurring invoice parameters including frequency and timezone
 * @param currentDate - The current/reference date (in UTC)
 * @returns The next scheduled date in UTC, adjusted for the user's timezone
 *
 * @example
 * ```ts
 * const nextDate = calculateNextScheduledDate({
 *   frequency: "monthly_date",
 *   frequencyDay: 15,
 *   frequencyWeek: null,
 *   frequencyInterval: null,
 *   timezone: "America/New_York"
 * }, new Date());
 * ```
 */
export function calculateNextScheduledDate(
  params: RecurringInvoiceParams,
  currentDate: Date,
): Date {
  const {
    frequency,
    frequencyDay,
    frequencyWeek,
    frequencyInterval,
    timezone,
  } = params;

  const createTZDate = tz(timezone);
  const tzCurrentDate = createTZDate(currentDate);

  let nextDate: Date;

  switch (frequency) {
    case "weekly": {
      // frequencyDay is 0-6 (Sunday-Saturday)
      // Clamp to valid range as defensive check (schema should enforce this)
      const targetDay = Math.min(Math.max(frequencyDay ?? 0, 0), 6);
      // Get next occurrence of the target weekday
      nextDate = setDay(addDays(tzCurrentDate, 1), targetDay, {
        weekStartsOn: 0,
      });
      // If we're past or on the target day, add a week
      if (nextDate <= tzCurrentDate) {
        nextDate = addDays(nextDate, 7);
      }
      break;
    }

    case "biweekly": {
      // Every 2 weeks (14 days) - maintains the same weekday automatically
      nextDate = addDays(tzCurrentDate, 14);
      break;
    }

    case "monthly_date": {
      // frequencyDay is 1-31 (day of month)
      const targetDayOfMonth = frequencyDay ?? 1;
      // Start with next month
      const nextMonth = addMonths(tzCurrentDate, 1);

      // Handle edge cases for months with fewer days
      const lastDay = lastDayOfMonth(nextMonth).getDate();
      const actualDay = Math.min(targetDayOfMonth, lastDay);

      nextDate = setDate(nextMonth, actualDay);
      break;
    }

    case "monthly_weekday": {
      // frequencyDay is 0-6 (day of week), frequencyWeek is 1-5 (which occurrence)
      // Clamp to valid range as defensive check (schema should enforce this)
      const targetDayOfWeek = Math.min(Math.max(frequencyDay ?? 0, 0), 6);
      const targetWeek = Math.min(Math.max(frequencyWeek ?? 1, 1), 5);

      // Get next month's nth weekday
      const nextMonth = addMonths(tzCurrentDate, 1);
      nextDate = getNthWeekdayOfMonth(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        targetDayOfWeek,
        targetWeek,
        timezone,
      );
      break;
    }

    case "monthly_last_day": {
      // Last day of next month
      const nextMonthForLastDay = addMonths(tzCurrentDate, 1);
      nextDate = lastDayOfMonth(nextMonthForLastDay);
      break;
    }

    case "quarterly": {
      // Every 3 months on the same day of month
      const targetDayOfMonthQ = frequencyDay ?? tzCurrentDate.getDate();
      const nextQuarter = addMonths(tzCurrentDate, 3);

      // Handle edge cases for months with fewer days
      const lastDayQ = lastDayOfMonth(nextQuarter).getDate();
      const actualDayQ = Math.min(targetDayOfMonthQ, lastDayQ);

      nextDate = setDate(nextQuarter, actualDayQ);
      break;
    }

    case "semi_annual": {
      // Every 6 months on the same day of month
      const targetDayOfMonthS = frequencyDay ?? tzCurrentDate.getDate();
      const nextSemiAnnual = addMonths(tzCurrentDate, 6);

      // Handle edge cases for months with fewer days
      const lastDayS = lastDayOfMonth(nextSemiAnnual).getDate();
      const actualDayS = Math.min(targetDayOfMonthS, lastDayS);

      nextDate = setDate(nextSemiAnnual, actualDayS);
      break;
    }

    case "annual": {
      // Every 12 months on the same day of month
      const targetDayOfMonthA = frequencyDay ?? tzCurrentDate.getDate();
      const nextAnnual = addMonths(tzCurrentDate, 12);

      // Handle edge cases for months with fewer days (e.g., Feb 29 -> Feb 28)
      const lastDayA = lastDayOfMonth(nextAnnual).getDate();
      const actualDayA = Math.min(targetDayOfMonthA, lastDayA);

      nextDate = setDate(nextAnnual, actualDayA);
      break;
    }

    case "custom": {
      // frequencyInterval is number of days
      const interval = frequencyInterval ?? 1;
      nextDate = addDays(tzCurrentDate, interval);
      break;
    }

    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }

  // Return as UTC by creating a new Date from the timezone-adjusted time
  return new Date(nextDate.getTime());
}

/**
 * Calculate the first scheduled date for a new recurring invoice.
 *
 * This determines when the first invoice in a recurring series should be generated:
 * - If issueDate is in the future: Schedule for that date
 * - If issueDate is today or in the past: Generate immediately (return now)
 *
 * Uses isDateInFutureUTC for consistent UTC day-level comparison across
 * frontend and backend, avoiding timezone-related edge cases.
 *
 * @param params - Recurring invoice parameters (unused currently, but available for future patterns)
 * @param issueDate - The issue date set by the user for the first invoice
 * @param now - The current date (defaults to new Date())
 * @returns The first scheduled date in UTC
 *
 * @example
 * ```ts
 * // Issue date is Jan 31 (future) - schedule for Jan 31
 * const firstDate = calculateFirstScheduledDate(params, new Date('2026-01-31'), new Date('2026-01-15'));
 * // Returns: 2026-01-31
 *
 * // Issue date is today - generate immediately
 * const firstDate = calculateFirstScheduledDate(params, new Date('2026-01-15'), new Date('2026-01-15'));
 * // Returns: 2026-01-15 (now)
 * ```
 */
export function calculateFirstScheduledDate(
  _params: RecurringInvoiceParams,
  issueDate: Date,
  now: Date = new Date(),
): Date {
  // If issue date is in the future (at the UTC day level), schedule for that date
  // Using isDateInFutureUTC ensures consistent behavior with frontend and API
  if (isDateInFutureUTC(issueDate, now)) {
    return issueDate;
  }

  // Issue date is today or in the past - generate immediately
  return now;
}

/**
 * Calculate upcoming invoice dates for preview
 * @param params - Recurring invoice parameters
 * @param startDate - The start date for calculations
 * @param amount - The invoice amount
 * @param currency - The currency
 * @param endType - How the series ends
 * @param endDate - End date (if endType is 'on_date')
 * @param endCount - End count (if endType is 'after_count')
 * @param alreadyGenerated - Number of invoices already generated
 * @param limit - Maximum number of previews to return
 * @returns Array of upcoming invoices and summary
 */
export function calculateUpcomingDates(
  params: RecurringInvoiceParams,
  startDate: Date,
  amount: number,
  currency: string,
  endType: InvoiceRecurringEndType,
  endDate: Date | null,
  endCount: number | null,
  alreadyGenerated = 0,
  limit = 10,
): { invoices: UpcomingInvoice[]; summary: UpcomingSummary } {
  const invoices: UpcomingInvoice[] = [];
  let currentDate = startDate;
  let count = 0;
  const maxIterations = endType === "never" ? limit : Math.min(limit, 100);

  // Calculate remaining invoices if there's a count limit
  const remaining =
    endType === "after_count" && endCount !== null
      ? endCount - alreadyGenerated
      : null;

  while (count < maxIterations) {
    // Check end conditions
    if (endType === "on_date" && endDate && currentDate > endDate) {
      break;
    }
    if (remaining !== null && count >= remaining) {
      break;
    }

    invoices.push({
      date: currentDate.toISOString(),
      amount,
    });

    count++;

    // Calculate next date
    currentDate = calculateNextScheduledDate(params, currentDate);
  }

  // Calculate summary
  let totalCount: number | null = null;
  let totalAmount: number | null = null;

  if (endType === "after_count" && endCount !== null) {
    totalCount = endCount;
    totalAmount = endCount * amount;
  } else if (endType === "on_date" && endDate) {
    // Count total invoices until end date
    let tempDate = startDate;
    let tempCount = 0;
    while (tempDate <= endDate && tempCount < 1000) {
      tempCount++;
      tempDate = calculateNextScheduledDate(params, tempDate);
    }
    totalCount = tempCount;
    totalAmount = tempCount * amount;
  }
  // For endType === "never", totalCount and totalAmount remain null

  return {
    invoices,
    summary: {
      hasEndDate: endType !== "never",
      totalCount,
      totalAmount,
      currency,
    },
  };
}

/**
 * Check if a recurring invoice should be marked as completed
 * @param endType - How the series ends
 * @param endDate - End date (if endType is 'on_date')
 * @param endCount - End count (if endType is 'after_count')
 * @param invoicesGenerated - Number of invoices generated
 * @param nextScheduledAt - Next scheduled date
 * @returns Whether the series should be marked as completed
 */
export function shouldMarkCompleted(
  endType: InvoiceRecurringEndType,
  endDate: Date | null,
  endCount: number | null,
  invoicesGenerated: number,
  nextScheduledAt: Date | null,
): boolean {
  switch (endType) {
    case "never":
      return false;

    case "on_date":
      return (
        endDate !== null &&
        nextScheduledAt !== null &&
        nextScheduledAt > endDate
      );

    case "after_count":
      return endCount !== null && invoicesGenerated >= endCount;

    default:
      return false;
  }
}

/**
 * Advance a scheduled date to the future if it's in the past.
 *
 * When the scheduler runs late, the calculated next date (based on the original
 * scheduled date) might still be in the past. This function advances through
 * missed intervals until reaching a future date.
 *
 * @param params - Recurring invoice parameters
 * @param scheduledDate - The initially calculated next scheduled date
 * @param now - The current time to compare against
 * @param maxIterations - Safety limit to prevent infinite loops (default: 1000)
 * @returns Object with the future date and number of intervals skipped
 *
 * @example
 * ```ts
 * // Biweekly invoice scheduled for Jan 1, processed on Jan 21
 * // Initial calculation: Jan 1 + 14 days = Jan 15 (still in past)
 * const result = advanceToFutureDate(params, new Date('2025-01-15'), new Date('2025-01-21'));
 * // result.date = Jan 29 (future)
 * // result.intervalsSkipped = 1
 * ```
 */
export function advanceToFutureDate(
  params: RecurringInvoiceParams,
  scheduledDate: Date,
  now: Date,
  maxIterations = 1000,
): { date: Date; intervalsSkipped: number; hitSafetyLimit: boolean } {
  let nextDate = scheduledDate;
  let intervalsSkipped = 0;

  while (nextDate <= now && intervalsSkipped < maxIterations) {
    nextDate = calculateNextScheduledDate(params, nextDate);
    intervalsSkipped++;
  }

  // If we hit the safety limit, fall back to scheduling from now
  const hitSafetyLimit = intervalsSkipped >= maxIterations;
  if (hitSafetyLimit) {
    nextDate = calculateNextScheduledDate(params, now);
  }

  return {
    date: nextDate,
    intervalsSkipped: hitSafetyLimit ? 0 : intervalsSkipped,
    hitSafetyLimit,
  };
}
