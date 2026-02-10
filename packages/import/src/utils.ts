import * as chrono from "chrono-node";
import { format } from "date-fns";

/**
 * Validates if a date is actually valid (handles month lengths and leap years).
 * Creates a Date object and verifies the components match what was requested.
 */
function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Formats a date string into YYYY-MM-DD format.
 * For ISO-format dates (YYYY-MM-DD...), extracts the date portion directly to preserve
 * the date in the original timezone (avoids UTC conversion shifting the date).
 * Falls back to chrono-node for other formats.
 */
export function formatDate(dateString: string): string | undefined {
  if (!dateString?.trim()) return undefined;

  const trimmed = dateString.trim();

  // Fast path: extract date directly from ISO-like formats (YYYY-MM-DD...)
  // This preserves the date in the source timezone instead of converting to UTC
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    // Validate the date is actually valid (handles month lengths and leap years)
    if (isValidDate(y, m, d)) {
      return `${year}-${month}-${day}`;
    }
    // Invalid ISO-format date (e.g., Feb 30), return undefined
    return undefined;
  }

  // Fallback: use chrono-node for other formats (Oct 1, 2025, 01/10/2025, etc.)
  const parsed = chrono.parseDate(trimmed);
  if (!parsed) return undefined;

  return format(parsed, "yyyy-MM-dd");
}

export function formatAmountValue({
  amount,
  inverted,
}: {
  amount: string;
  inverted?: boolean;
}) {
  let value: number;

  // Handle special minus sign (−) by replacing with standard minus (-)
  const normalizedAmount = amount.replace(/−/g, "-");

  if (normalizedAmount.includes(",")) {
    // Remove thousands separators and replace the comma with a period.
    value = +normalizedAmount.replace(/\./g, "").replace(",", ".");
  } else if (normalizedAmount.match(/\.\d{2}$/)) {
    // If it ends with .XX, it's likely a decimal; remove internal periods.
    value = +normalizedAmount.replace(/\.(?=\d{3})/g, "");
  } else {
    // If neither condition is met, convert the amount directly to a number
    value = +normalizedAmount;
  }

  if (inverted) {
    return +(value * -1);
  }

  return value;
}
