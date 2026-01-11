import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import type { DateRange } from "react-day-picker";

export type DatePresetOption = {
  label: string;
  value: string;
  dateRange: DateRange;
};

/**
 * Get accounting-focused date presets for filtering.
 * Optimized for bookkeeping and reconciliation workflows.
 */
export function getDatePresets(): DatePresetOption[] {
  const now = new Date();

  return [
    // Reconciliation periods
    {
      label: "This month",
      value: "this-month",
      dateRange: {
        from: startOfMonth(now),
        to: endOfMonth(now),
      },
    },
    {
      label: "Last month",
      value: "last-month",
      dateRange: {
        from: startOfMonth(subMonths(now, 1)),
        to: endOfMonth(subMonths(now, 1)),
      },
    },
    // Tax filing periods
    {
      label: "This quarter",
      value: "this-quarter",
      dateRange: {
        from: startOfQuarter(now),
        to: endOfQuarter(now),
      },
    },
    {
      label: "Last quarter",
      value: "last-quarter",
      dateRange: {
        from: startOfQuarter(subQuarters(now, 1)),
        to: endOfQuarter(subQuarters(now, 1)),
      },
    },
    // Annual reporting
    {
      label: "Year to date",
      value: "year-to-date",
      dateRange: {
        from: startOfYear(now),
        to: now,
      },
    },
    {
      label: "Last year",
      value: "last-year",
      dateRange: {
        from: startOfYear(subYears(now, 1)),
        to: endOfYear(subYears(now, 1)),
      },
    },
    // Recent activity review
    {
      label: "Last 30 days",
      value: "last-30-days",
      dateRange: {
        from: subDays(now, 30),
        to: now,
      },
    },
    {
      label: "Last 60 days",
      value: "last-60-days",
      dateRange: {
        from: subDays(now, 60),
        to: now,
      },
    },
    {
      label: "Last 90 days",
      value: "last-90-days",
      dateRange: {
        from: subDays(now, 90),
        to: now,
      },
    },
  ];
}
