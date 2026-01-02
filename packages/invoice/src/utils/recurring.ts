import { format } from "date-fns";

export type InvoiceRecurringFrequency =
  | "weekly"
  | "monthly_date"
  | "monthly_weekday"
  | "custom";

export type InvoiceRecurringStatus = "active" | "paused" | "completed";

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
  return s[(v - 20) % 10] || s[v] || s[0];
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
