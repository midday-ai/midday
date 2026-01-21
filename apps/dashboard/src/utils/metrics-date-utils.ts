import { getFiscalYearDates } from "@midday/utils";
import {
  format,
  formatISO,
  parseISO,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";

export type PeriodOption =
  | "3-months"
  | "6-months"
  | "this-year"
  | "1-year"
  | "2-years"
  | "5-years"
  | "fiscal-year"
  | "custom";

/**
 * Get display label for a period option
 */
export function getPeriodLabel(
  period: PeriodOption,
  from?: string,
  to?: string,
): string {
  switch (period) {
    case "3-months":
      return "3 months";
    case "6-months":
      return "6 months";
    case "this-year":
      return "This year";
    case "1-year":
      return "1 year";
    case "2-years":
      return "2 years";
    case "5-years":
      return "5 years";
    case "fiscal-year":
      return "Fiscal year";
    case "custom":
      if (from && to) {
        const fromDate = parseISO(from);
        const toDate = parseISO(to);
        return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
      }
      return "Custom";
    default:
      return "1 year";
  }
}

export function getPeriodDateRange(
  period: PeriodOption,
  fiscalYearStartMonth?: number | null,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const now = new Date();
  const to = formatISO(now, { representation: "date" });

  switch (period) {
    case "3-months": {
      const from = subMonths(now, 3);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    case "6-months": {
      const from = subMonths(now, 6);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    case "this-year": {
      const from = startOfYear(now);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    case "1-year": {
      const from = subYears(now, 1);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    case "2-years": {
      const from = subYears(now, 2);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    case "5-years": {
      const from = subYears(now, 5);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    case "fiscal-year": {
      const { from: fiscalFrom, to: fiscalTo } = getFiscalYearDates(
        fiscalYearStartMonth,
        now,
      );
      return {
        from: formatISO(fiscalFrom, { representation: "date" }),
        to: formatISO(fiscalTo, { representation: "date" }),
      };
    }
    case "custom": {
      // Use custom dates if provided, otherwise fall back to 1 year
      if (customFrom && customTo) {
        return { from: customFrom, to: customTo };
      }
      const from = subYears(now, 1);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
    default: {
      // Default to 1 year
      const from = subYears(now, 1);
      return {
        from: formatISO(from, { representation: "date" }),
        to,
      };
    }
  }
}
