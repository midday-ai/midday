import { getFiscalYearToDate } from "@midday/utils";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

/**
 * Get default date range for AI tools based on fiscal year settings.
 * Uses fiscal year-to-date when fiscal year is configured, otherwise falls back to trailing 12 months.
 *
 * @param fiscalYearStartMonth - The fiscal year start month (1-12) or null/undefined
 * @returns Object with `from` and `to` ISO date strings
 */
export function getToolDateDefaults(fiscalYearStartMonth?: number | null): {
  from: string;
  to: string;
} {
  // If fiscal year is configured, use fiscal year-to-date
  if (fiscalYearStartMonth != null) {
    const { from, to } = getFiscalYearToDate(fiscalYearStartMonth);
    return {
      from: startOfMonth(from).toISOString(),
      to: endOfMonth(to).toISOString(),
    };
  }

  // Fallback to trailing 12 months (calendar year)
  const to = endOfMonth(new Date());
  const from = startOfMonth(subMonths(to, 11));

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
