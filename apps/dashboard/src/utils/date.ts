import { TZDate } from "@date-fns/tz";

/**
 * Parse a date-only string (YYYY-MM-DD) as a UTC calendar date.
 *
 * Use this for date strings from URL params, API responses, or user input
 * where you want to preserve the exact calendar date without timezone shifts.
 *
 * This solves the common problem where:
 * - `parseISO("2026-01-09")` interprets as LOCAL midnight (inconsistent across timezones)
 * - `new Date("2026-01-09T00:00:00Z")` creates UTC midnight, but `format()` shifts it
 *
 * `TZDate(dateStr, "UTC")` maintains timezone context so `format()` respects it.
 *
 * @example
 * // URL param: ?selectedDate=2026-01-09
 * const date = parseDateAsUTC("2026-01-09");
 * format(date, "yyyy-MM-dd"); // Always "2026-01-09" regardless of user's timezone
 */
export function parseDateAsUTC(dateStr: string): TZDate {
  return new TZDate(dateStr, "UTC");
}
