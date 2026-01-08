import { addDays, format, getDay, lastDayOfMonth } from "date-fns";

// ============================================================================
// Canonical Type Definitions - Single Source of Truth
// These constants and types should be used across all packages
// ============================================================================

// ============================================================================
// UTC Date Comparison Utilities
// These ensure consistent date comparisons across frontend and backend
// by using UTC instead of local timezone
// ============================================================================

/**
 * Get the start of day in UTC for a given date.
 * This normalizes the date to midnight UTC, useful for day-level comparisons.
 *
 * @param date - The date to normalize
 * @returns A new Date object set to 00:00:00.000 UTC on the same UTC day
 */
export function getStartOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Convert a local date selection to UTC midnight.
 *
 * This is different from getStartOfDayUTC which preserves the UTC date.
 * This function preserves the LOCAL date components (year, month, day)
 * and creates a UTC midnight timestamp for that local date.
 *
 * Use case: When a user selects a date in a calendar/date picker, the browser
 * returns a Date object representing local midnight. If we want to store this
 * as a timezone-agnostic "date-only" value, we need to convert it to UTC midnight
 * using the local date components.
 *
 * @example
 * // User in EST (UTC-5) selects January 15 in a date picker
 * const localSelection = new Date(2024, 0, 15); // Local midnight = 2024-01-15T05:00:00.000Z
 *
 * // getStartOfDayUTC preserves the UTC date (January 15 at UTC midnight)
 * getStartOfDayUTC(localSelection); // 2024-01-15T00:00:00.000Z ✓ (same since UTC date is still Jan 15)
 *
 * // BUT for a user in UTC+14 selecting January 15:
 * const utcPlus14Selection = new Date(2024, 0, 15); // Local midnight = 2024-01-14T10:00:00.000Z
 * getStartOfDayUTC(utcPlus14Selection); // 2024-01-14T00:00:00.000Z ✗ (wrong! shows Jan 14)
 * localDateToUTCMidnight(utcPlus14Selection); // 2024-01-15T00:00:00.000Z ✓ (correct! shows Jan 15)
 *
 * @param date - A Date object from local date selection (e.g., from a date picker)
 * @returns ISO string representing UTC midnight for the selected local date
 */
export function localDateToUTCMidnight(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

/**
 * Check if a date is in the future compared to now, at the day level in UTC.
 *
 * This compares only the date portion (year, month, day) in UTC, ignoring time.
 * A date is considered "in the future" if its UTC day is strictly after today's UTC day.
 *
 * Use this instead of direct `date > new Date()` comparisons to ensure consistent
 * behavior between frontend and backend, regardless of server timezone.
 *
 * @param date - The date to check
 * @param now - Optional reference date (defaults to current time)
 * @returns true if date's UTC day is after now's UTC day
 *
 * @example
 * ```ts
 * // Issue date is tomorrow
 * isDateInFutureUTC(new Date('2026-01-06'), new Date('2026-01-05T23:59:59Z')) // true
 *
 * // Issue date is today (even if hours differ)
 * isDateInFutureUTC(new Date('2026-01-05T00:00:00Z'), new Date('2026-01-05T23:59:59Z')) // false
 *
 * // Issue date is in the past
 * isDateInFutureUTC(new Date('2026-01-04'), new Date('2026-01-05T00:00:00Z')) // false
 * ```
 */
export function isDateInFutureUTC(date: Date, now: Date = new Date()): boolean {
  const dateStartUTC = getStartOfDayUTC(date);
  const nowStartUTC = getStartOfDayUTC(now);
  return dateStartUTC.getTime() > nowStartUTC.getTime();
}

/**
 * All valid recurring invoice frequencies.
 * Used to derive both TypeScript types and Zod schemas.
 */
export const RECURRING_FREQUENCIES = [
  "weekly",
  "biweekly",
  "monthly_date",
  "monthly_weekday",
  "monthly_last_day",
  "quarterly",
  "semi_annual",
  "annual",
  "custom",
] as const;

/**
 * All valid recurring invoice statuses.
 * Used to derive both TypeScript types and Zod schemas.
 */
export const RECURRING_STATUSES = [
  "active",
  "paused",
  "completed",
  "canceled",
] as const;

/**
 * All valid recurring invoice end types.
 * Used to derive both TypeScript types and Zod schemas.
 */
export const RECURRING_END_TYPES = ["never", "on_date", "after_count"] as const;

/** Invoice recurring frequency type derived from RECURRING_FREQUENCIES constant */
export type InvoiceRecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

/** Invoice recurring status type derived from RECURRING_STATUSES constant */
export type InvoiceRecurringStatus = (typeof RECURRING_STATUSES)[number];

/** Invoice recurring end type derived from RECURRING_END_TYPES constant */
export type InvoiceRecurringEndType = (typeof RECURRING_END_TYPES)[number];

/**
 * Format a date string to day of week abbreviation (e.g., "Fri", "Mon")
 */
export function formatDayOfWeek(date: string | Date): string {
  return format(new Date(date), "EEE");
}

/**
 * Format a date string to a short date display (e.g., "Jan 2")
 */
export function formatShortDate(date: string | Date): string {
  return format(new Date(date), "MMM d");
}

/**
 * Get human-readable frequency label
 * @example "Weekly on Friday" or "Monthly on the 15th"
 */
export function getFrequencyLabel(
  frequency: InvoiceRecurringFrequency,
  frequencyDay: number | null,
  frequencyWeek: number | null,
): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const ordinals = ["1st", "2nd", "3rd", "4th", "5th"];

  switch (frequency) {
    case "weekly":
      return `Weekly on ${dayNames[frequencyDay ?? 0]}`;

    case "biweekly":
      return `Bi-weekly on ${dayNames[frequencyDay ?? 0]}`;

    case "monthly_date": {
      const day = frequencyDay ?? 1;
      return `Monthly on the ${formatOrdinal(day)}`;
    }

    case "monthly_weekday":
      return `Monthly on the ${ordinals[(frequencyWeek ?? 1) - 1]} ${dayNames[frequencyDay ?? 0]}`;

    case "monthly_last_day":
      return "Monthly on the last day";

    case "quarterly": {
      const dayQ = frequencyDay ?? 1;
      return `Quarterly on the ${formatOrdinal(dayQ)}`;
    }

    case "semi_annual": {
      const dayS = frequencyDay ?? 1;
      return `Semi-annually on the ${formatOrdinal(dayS)}`;
    }

    case "annual": {
      const dayA = frequencyDay ?? 1;
      return `Annually on the ${formatOrdinal(dayA)}`;
    }

    case "custom":
      return "Custom";

    default:
      return "Unknown";
  }
}

/**
 * Get short frequency label (e.g., "Weekly", "Monthly")
 * @param frequency - The recurring frequency
 * @param frequencyInterval - Optional interval for custom frequency (shows "Every X days")
 */
export function getFrequencyShortLabel(
  frequency: InvoiceRecurringFrequency,
  frequencyInterval?: number | null,
): string {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Bi-weekly";
    case "monthly_date":
    case "monthly_weekday":
    case "monthly_last_day":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "semi_annual":
      return "Semi-annual";
    case "annual":
      return "Annual";
    case "custom":
      // Show the actual interval for custom frequency
      if (frequencyInterval) {
        return `Every ${frequencyInterval} days`;
      }
      return "Custom";
    default:
      return "Unknown";
  }
}

/**
 * Format a number as an ordinal (1st, 2nd, 3rd, 4th, etc.)
 */
export function formatOrdinal(n: number): string {
  const suffix = getOrdinalSuffix(n);
  return `${n}${suffix}`;
}

/**
 * Get ordinal suffix for a number (st, nd, rd, th)
 */
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? "th";
}

/**
 * Format recurring invoice progress (e.g., "1 of 11")
 */
export function formatRecurringProgress(
  sequence: number | null,
  totalCount: number | null,
): string {
  if (sequence === null) return "";
  if (totalCount === null) return `${sequence}`;
  return `${sequence} of ${totalCount}`;
}

/**
 * Format next scheduled date for display
 * @returns Display string (e.g., "Next on Feb 1" or "Series complete")
 */
export function formatNextScheduled(
  nextScheduledAt: string | Date | null,
  status: InvoiceRecurringStatus,
): string {
  if (status === "completed") return "Series complete";
  if (status === "paused") return "Paused";
  if (!nextScheduledAt) return "";
  return `Next on ${format(new Date(nextScheduledAt), "MMM d")}`;
}

// ============================================================================
// Date Calculation Utilities (Client-Side Preview)
// ============================================================================
//
// These date calculation functions are for UI preview purposes only.
// They provide approximate next invoice dates for display in the dashboard.
//
// IMPORTANT: These are simplified calculations without timezone support.
// The server-side calculations in @midday/db/utils/invoice-recurring use
// proper timezone handling via @date-fns/tz and are the authoritative source
// for actual invoice scheduling.
//
// Use these for:
// - Showing preview dates in the recurring invoice configuration UI
// - Displaying upcoming invoice calendars
// - Client-side summary calculations
//
// Do NOT use these for:
// - Actual invoice scheduling (use server-side calculateNextScheduledDate)
// - Any operation where timezone accuracy matters
// ============================================================================

export interface RecurringConfig {
  frequency: InvoiceRecurringFrequency;
  frequencyDay: number | null;
  frequencyWeek: number | null;
  frequencyInterval: number | null;
  /** null means user hasn't selected yet - used for requiring explicit selection */
  endType: InvoiceRecurringEndType | null;
  endDate: string | null;
  endCount: number | null;
}

export interface UpcomingInvoice {
  date: Date;
  amount: number;
}

/**
 * Get the nth occurrence of a weekday in a given month
 * @param year - The year
 * @param month - The month (0-11)
 * @param dayOfWeek - The day of week (0 = Sunday, 6 = Saturday)
 * @param week - Which occurrence (1 = first, 2 = second, etc.)
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  week: number,
): Date {
  // Start from the first day of the month
  let date = new Date(year, month, 1);

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
 * Calculate next date based on frequency (client-side preview version).
 *
 * **Client-Side Only - For UI Preview**
 *
 * This is a simplified version without timezone support, intended only for:
 * - Showing approximate upcoming dates in the UI
 * - Preview calendars in the recurring invoice configuration
 *
 * For actual invoice scheduling, the server uses `calculateNextScheduledDate`
 * from `@midday/db/utils/invoice-recurring`, which includes proper timezone
 * handling via `@date-fns/tz`.
 *
 * @param config - The recurring configuration
 * @param currentDate - The reference date to calculate from
 * @returns The next scheduled date (approximate, no timezone adjustment)
 */
export function getNextDate(config: RecurringConfig, currentDate: Date): Date {
  switch (config.frequency) {
    case "weekly": {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      return next;
    }
    case "biweekly": {
      // Every 2 weeks (14 days) - maintains the same weekday automatically
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 14);
      return next;
    }
    case "monthly_date": {
      // Get the target day of month (1-31)
      const targetDayOfMonth = config.frequencyDay ?? currentDate.getDate();

      // Create next month date safely by starting from day 1
      // This avoids JavaScript's automatic date rollover
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1, // Start with day 1 to avoid rollover
      );

      // Clamp to last day of month if target day exceeds month length
      // (e.g., 31st in a 30-day month becomes 30th)
      const lastDay = lastDayOfMonth(nextMonth).getDate();
      nextMonth.setDate(Math.min(targetDayOfMonth, lastDay));

      return nextMonth;
    }
    case "monthly_weekday": {
      // frequencyDay is 0-6 (day of week), frequencyWeek is 1-5 (which occurrence)
      const targetDayOfWeek = Math.min(
        Math.max(config.frequencyDay ?? 0, 0),
        6,
      );
      const targetWeek = Math.min(Math.max(config.frequencyWeek ?? 1, 1), 5);

      // Get next month's nth weekday
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      return getNthWeekdayOfMonth(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        targetDayOfWeek,
        targetWeek,
      );
    }
    case "monthly_last_day": {
      // Last day of next month
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      );
      return lastDayOfMonth(nextMonth);
    }
    case "quarterly": {
      // Every 3 months on the same day
      const targetDayQ = config.frequencyDay ?? currentDate.getDate();
      const nextQuarter = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 3,
        1,
      );
      const lastDayQ = lastDayOfMonth(nextQuarter).getDate();
      nextQuarter.setDate(Math.min(targetDayQ, lastDayQ));
      return nextQuarter;
    }
    case "semi_annual": {
      // Every 6 months on the same day
      const targetDayS = config.frequencyDay ?? currentDate.getDate();
      const nextSemiAnnual = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 6,
        1,
      );
      const lastDayS = lastDayOfMonth(nextSemiAnnual).getDate();
      nextSemiAnnual.setDate(Math.min(targetDayS, lastDayS));
      return nextSemiAnnual;
    }
    case "annual": {
      // Every 12 months on the same day
      const targetDayA = config.frequencyDay ?? currentDate.getDate();
      const nextAnnual = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 12,
        1,
      );
      const lastDayA = lastDayOfMonth(nextAnnual).getDate();
      nextAnnual.setDate(Math.min(targetDayA, lastDayA));
      return nextAnnual;
    }
    case "custom": {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + (config.frequencyInterval ?? 1));
      return next;
    }
    default:
      return new Date(currentDate);
  }
}

/**
 * Calculate upcoming invoice dates for preview (client-side version)
 */
export function calculatePreviewDates(
  config: RecurringConfig,
  startDate: Date,
  amount: number,
  limit = 3,
): UpcomingInvoice[] {
  const invoices: UpcomingInvoice[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < limit; i++) {
    // Check end conditions
    if (config.endType === "on_date" && config.endDate) {
      if (currentDate > new Date(config.endDate)) break;
    }
    if (config.endType === "after_count" && config.endCount !== null) {
      if (i >= config.endCount) break;
    }

    invoices.push({
      date: new Date(currentDate),
      amount,
    });

    // Calculate next date based on frequency
    currentDate = getNextDate(config, currentDate);
  }

  return invoices;
}

/**
 * Calculate total invoices and amount for the series
 */
export function calculateSummary(
  config: RecurringConfig,
  startDate: Date,
  amount: number,
): { totalCount: number | null; totalAmount: number | null } {
  if (config.endType === "never") {
    return { totalCount: null, totalAmount: null };
  }

  if (config.endType === "after_count" && config.endCount !== null) {
    return {
      totalCount: config.endCount,
      totalAmount: config.endCount * amount,
    };
  }

  if (config.endType === "on_date" && config.endDate) {
    let count = 0;
    let currentDate = new Date(startDate);
    const endDate = new Date(config.endDate);

    while (currentDate <= endDate && count < 1000) {
      count++;
      currentDate = getNextDate(config, currentDate);
    }

    return {
      totalCount: count,
      totalAmount: count * amount,
    };
  }

  return { totalCount: null, totalAmount: null };
}

// ============================================================================
// Validation Utilities (Client-Side)
// ============================================================================
//
// These validation functions are for immediate UI feedback only.
// They mirror the server-side Zod schema validation but run locally
// to provide instant feedback without a network round-trip.
//
// IMPORTANT: The server (API schema) is the single source of truth for validation.
// These client-side checks should match the schema validation, but the server
// validation is authoritative and will reject invalid data even if client
// validation is bypassed or outdated.
// ============================================================================

export interface RecurringConfigValidationError {
  field: string;
  message: string;
}

/**
 * Validate a recurring config and return any errors.
 *
 * NOTE: This is client-side validation for immediate UI feedback.
 * The API schema performs the authoritative validation server-side.
 *
 * @returns Array of validation errors (empty if valid)
 */
export function validateRecurringConfig(
  config: RecurringConfig,
): RecurringConfigValidationError[] {
  const errors: RecurringConfigValidationError[] = [];

  // Validate frequencyDay is required for weekly frequency
  if (config.frequency === "weekly") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of week is required for weekly frequency",
      });
    } else if (config.frequencyDay < 0 || config.frequencyDay > 6) {
      errors.push({
        field: "frequencyDay",
        message: "Day of week must be 0-6 (Sunday-Saturday)",
      });
    }
  }

  // Validate frequencyDay is required for biweekly frequency
  if (config.frequency === "biweekly") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of week is required for bi-weekly frequency",
      });
    } else if (config.frequencyDay < 0 || config.frequencyDay > 6) {
      errors.push({
        field: "frequencyDay",
        message: "Day of week must be 0-6 (Sunday-Saturday)",
      });
    }
  }

  // monthly_last_day doesn't require any additional fields (no frequencyDay needed)

  // Validate frequencyDay is required for monthly_date frequency
  if (config.frequency === "monthly_date") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month is required for monthly frequency",
      });
    } else if (config.frequencyDay < 1 || config.frequencyDay > 31) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month must be 1-31",
      });
    }
  }

  // Validate frequencyDay is required for quarterly frequency
  if (config.frequency === "quarterly") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month is required for quarterly frequency",
      });
    } else if (config.frequencyDay < 1 || config.frequencyDay > 31) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month must be 1-31",
      });
    }
  }

  // Validate frequencyDay is required for semi_annual frequency
  if (config.frequency === "semi_annual") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month is required for semi-annual frequency",
      });
    } else if (config.frequencyDay < 1 || config.frequencyDay > 31) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month must be 1-31",
      });
    }
  }

  // Validate frequencyDay is required for annual frequency
  if (config.frequency === "annual") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month is required for annual frequency",
      });
    } else if (config.frequencyDay < 1 || config.frequencyDay > 31) {
      errors.push({
        field: "frequencyDay",
        message: "Day of month must be 1-31",
      });
    }
  }

  // Validate frequencyDay and frequencyWeek are required for monthly_weekday frequency
  if (config.frequency === "monthly_weekday") {
    if (config.frequencyDay === null || config.frequencyDay === undefined) {
      errors.push({
        field: "frequencyDay",
        message: "Day of week is required for monthly weekday frequency",
      });
    } else if (config.frequencyDay < 0 || config.frequencyDay > 6) {
      errors.push({
        field: "frequencyDay",
        message: "Day of week must be 0-6 (Sunday-Saturday)",
      });
    }

    if (config.frequencyWeek === null || config.frequencyWeek === undefined) {
      errors.push({
        field: "frequencyWeek",
        message: "Week occurrence is required for monthly weekday frequency",
      });
    } else if (config.frequencyWeek < 1 || config.frequencyWeek > 5) {
      errors.push({
        field: "frequencyWeek",
        message: "Week occurrence must be 1-5 (1st through 5th)",
      });
    }
  }

  // Validate frequencyInterval is required for custom frequency
  if (config.frequency === "custom") {
    if (
      config.frequencyInterval === null ||
      config.frequencyInterval === undefined
    ) {
      errors.push({
        field: "frequencyInterval",
        message: "Day interval is required for custom frequency",
      });
    } else if (config.frequencyInterval < 1) {
      errors.push({
        field: "frequencyInterval",
        message: "Day interval must be at least 1",
      });
    }
  }

  // Validate endDate is required when endType is 'on_date'
  if (config.endType === "on_date") {
    if (!config.endDate) {
      errors.push({
        field: "endDate",
        message: "End date is required when ending on a specific date",
      });
    }
  }

  // Validate endCount is required when endType is 'after_count'
  if (config.endType === "after_count") {
    if (config.endCount === null || config.endCount === undefined) {
      errors.push({
        field: "endCount",
        message: "Invoice count is required when ending after a count",
      });
    } else if (config.endCount < 1) {
      errors.push({
        field: "endCount",
        message: "Invoice count must be at least 1",
      });
    }
  }

  return errors;
}

/**
 * Check if a recurring config is valid
 * @returns true if valid, false otherwise
 */
export function isValidRecurringConfig(config: RecurringConfig): boolean {
  return validateRecurringConfig(config).length === 0;
}
