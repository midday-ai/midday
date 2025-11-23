/**
 * Generate formatted artifact descriptions based on date ranges
 */
import {
  differenceInDays,
  endOfYear,
  format,
  getYear,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfYear,
} from "date-fns";

/**
 * Parse a date string (ISO format or similar) and return Date object
 * Uses parseISO from date-fns for ISO 8601 strings, falls back to Date constructor
 */
function parseDate(dateStr: string): Date | null {
  // Try parseISO first (handles ISO 8601 format)
  const isoDate = parseISO(dateStr);
  if (isValid(isoDate)) {
    return isoDate;
  }

  // Fallback to Date constructor for other formats
  const fallbackDate = new Date(dateStr);
  return isValid(fallbackDate) ? fallbackDate : null;
}

/**
 * Check if a date range is approximately a full calendar year
 */
function isApproxFullYear(fromDate: Date, toDate: Date): boolean {
  const fromYearStart = startOfYear(fromDate);
  const toYearEnd = endOfYear(toDate);

  // Check if range spans approximately a full year (within 10 days of year boundaries)
  const daysFromStart = differenceInDays(fromDate, fromYearStart);
  const daysToEnd = differenceInDays(toYearEnd, toDate);

  return daysFromStart <= 10 && daysToEnd <= 10;
}

/**
 * Format a date range into a human-readable description
 *
 * Examples:
 * - Same month: "Aug 2024"
 * - Same year, different months: "Jan-Aug 2024"
 * - Full calendar year: "2024" (when range is approximately Jan 1 - Dec 31 of same year)
 * - Different years: "2022-2024"
 */
export function generateArtifactDescription(from: string, to: string): string {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  // Fallback if dates are invalid
  if (!fromDate || !toDate) {
    return `${from} to ${to}`;
  }

  const fromYear = getYear(fromDate);
  const toYear = getYear(toDate);

  // Same year, same month
  if (isSameYear(fromDate, toDate) && isSameMonth(fromDate, toDate)) {
    return format(fromDate, "MMM yyyy");
  }

  // Same year, different months
  if (isSameYear(fromDate, toDate)) {
    // If it's approximately a full calendar year, show just the year
    if (isApproxFullYear(fromDate, toDate)) {
      return `${fromYear}`;
    }
    return `${format(fromDate, "MMM")}-${format(toDate, "MMM")} ${fromYear}`;
  }

  // Different years - check if it's approximately one full calendar year
  // If it spans from near the start of one year to near the end of the next, show the later year
  if (toYear === fromYear + 1 && isApproxFullYear(fromDate, toDate)) {
    return `${toYear}`;
  }

  // Different years - show range
  return `${fromYear}-${toYear}`;
}
