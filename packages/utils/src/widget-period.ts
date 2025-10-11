import type { WidgetPeriod } from "@midday/cache/widget-preferences-cache";
import {
  endOfMonth,
  endOfQuarter,
  startOfMonth,
  startOfQuarter,
  subMonths,
} from "date-fns";
import { getFiscalYearDates, getFiscalYearToDate } from "./fiscal-year";

interface DateRange {
  from: string; // ISO string
  to: string; // ISO string
}

/**
 * Get date range based on widget period and fiscal year settings
 */
export function getWidgetPeriodDates(
  period: WidgetPeriod | undefined,
  fiscalYearStartMonth: number | null | undefined,
  referenceDate = new Date(),
): DateRange {
  switch (period) {
    case "fiscal_ytd": {
      const { from, to } = getFiscalYearToDate(
        fiscalYearStartMonth,
        referenceDate,
      );
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    case "fiscal_year": {
      const { from, to } = getFiscalYearDates(
        fiscalYearStartMonth,
        referenceDate,
      );
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    case "current_quarter": {
      const from = startOfQuarter(referenceDate);
      const to = endOfQuarter(referenceDate);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    case "trailing_12": {
      const to = endOfMonth(referenceDate);
      const from = startOfMonth(subMonths(to, 11));
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    case "current_month": {
      const from = startOfMonth(referenceDate);
      const to = endOfMonth(referenceDate);
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    default: {
      // Default to fiscal YTD
      const { from, to } = getFiscalYearToDate(
        fiscalYearStartMonth,
        referenceDate,
      );
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }
  }
}
