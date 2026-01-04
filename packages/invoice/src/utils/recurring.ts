import { addDays, format, getDay, lastDayOfMonth } from "date-fns";

export type InvoiceRecurringFrequency =
  | "weekly"
  | "monthly_date"
  | "monthly_weekday"
  | "custom";

export type InvoiceRecurringStatus =
  | "active"
  | "paused"
  | "completed"
  | "canceled";

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

    case "monthly_date": {
      const day = frequencyDay ?? 1;
      return `Monthly on the ${formatOrdinal(day)}`;
    }

    case "monthly_weekday":
      return `Monthly on the ${ordinals[(frequencyWeek ?? 1) - 1]} ${dayNames[frequencyDay ?? 0]}`;

    case "custom":
      return "Custom";

    default:
      return "Unknown";
  }
}

/**
 * Get short frequency label (e.g., "Weekly", "Monthly")
 */
export function getFrequencyShortLabel(
  frequency: InvoiceRecurringFrequency,
): string {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "monthly_date":
    case "monthly_weekday":
      return "Monthly";
    case "custom":
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
// Date Calculation Utilities (Client-side preview)
// ============================================================================

export type RecurringEndType = "never" | "on_date" | "after_count";

export interface RecurringConfig {
  frequency: InvoiceRecurringFrequency;
  frequencyDay: number | null;
  frequencyWeek: number | null;
  frequencyInterval: number | null;
  endType: RecurringEndType;
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
 * Calculate next date based on frequency (client-side preview version)
 * Note: This is a simplified version without timezone support for preview purposes.
 * Server-side uses calculateNextScheduledDate from @midday/db for actual scheduling.
 */
export function getNextDate(config: RecurringConfig, currentDate: Date): Date {
  switch (config.frequency) {
    case "weekly": {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
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
// Validation Utilities
// ============================================================================

export interface RecurringConfigValidationError {
  field: string;
  message: string;
}

/**
 * Validate a recurring config and return any errors
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
