import { getFiscalYearToDate } from "@midday/utils";
import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import type { DateRange } from "react-day-picker";

export type PresetOption = {
  label: string;
  value: string;
  dateRange: DateRange;
};

export const getPresetOptions = (
  fiscalYearStartMonth?: number | null,
): PresetOption[] => {
  const now = new Date();
  const to = now;

  const presets: PresetOption[] = [];

  // Add fiscal year preset if configured
  if (fiscalYearStartMonth != null) {
    const { from: fiscalFrom, to: fiscalTo } =
      getFiscalYearToDate(fiscalYearStartMonth);
    presets.push({
      label: "Fiscal Year",
      value: "fiscal-year",
      dateRange: {
        from: fiscalFrom,
        to: fiscalTo,
      },
    });
  }

  // Add SMB-focused presets (most commonly used first)
  presets.push(
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
    {
      label: "3 months",
      value: "3-months",
      dateRange: {
        from: subMonths(now, 3),
        to,
      },
    },
    {
      label: "6 months",
      value: "6-months",
      dateRange: {
        from: subMonths(now, 6),
        to,
      },
    },
    {
      label: "1 year",
      value: "1-year",
      dateRange: {
        from: subYears(now, 1),
        to,
      },
    },
    {
      label: "2 years",
      value: "2-years",
      dateRange: {
        from: subYears(now, 2),
        to,
      },
    },
    {
      label: "5 years",
      value: "5-years",
      dateRange: {
        from: subYears(now, 5),
        to,
      },
    },
  );

  return presets;
};
