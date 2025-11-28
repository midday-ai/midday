import * as chrono from "chrono-node";
import { isValid, parseISO } from "date-fns";

/**
 * Formats a date string into YYYY-MM-DD format.
 * Uses parseISO for fast ISO format parsing, falls back to chrono-node for other formats.
 * Extracts date components directly to avoid timezone-related date shifts.
 */
export function formatDate(dateString: string): string | undefined {
  if (!dateString?.trim()) return undefined;

  const trimmed = dateString.trim();

  // Fast path: try parseISO first for ISO-like formats (2025-10-01, 2025-10-01T00:00:00, etc.)
  const isoDate = parseISO(trimmed);
  if (isValid(isoDate)) {
    const year = isoDate.getFullYear();
    const month = String(isoDate.getMonth() + 1).padStart(2, "0");
    const day = String(isoDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Fallback: use chrono-node for other formats (Oct 1, 2025, 01/10/2025 UTC, etc.)
  const parsed = chrono.parseDate(trimmed);
  if (!parsed) return undefined;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatAmountValue({
  amount,
  inverted,
}: { amount: string; inverted?: boolean }) {
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
