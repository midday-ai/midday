import { tz } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  getDay,
  lastDayOfMonth,
  setDate,
  setDay,
} from "date-fns";

export type InvoiceRecurringFrequency =
  | "weekly"
  | "monthly_date"
  | "monthly_weekday"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "custom";

export type InvoiceRecurringEndType = "never" | "on_date" | "after_count";

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
 * Calculate the next scheduled date for a recurring invoice
 * @param params - Recurring invoice parameters
 * @param currentDate - The current/reference date (in UTC)
 * @returns The next scheduled date in UTC
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
 * Calculate the first scheduled date for a new recurring invoice
 * This calculates when the first invoice should be generated (immediately = today)
 * @param params - Recurring invoice parameters
 * @param startDate - The start date (typically now)
 * @returns The first scheduled date in UTC
 */
export function calculateFirstScheduledDate(
  params: RecurringInvoiceParams,
  startDate: Date,
): Date {
  // For the first invoice, we return the start date (now)
  // The next invoice will be calculated after the first one is generated
  return startDate;
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
