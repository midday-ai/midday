import type { AppContext } from "@api/ai/context";
import { format, startOfYear, subMonths, subYears } from "date-fns";

type PeriodOption =
  | "3-months"
  | "6-months"
  | "this-year"
  | "1-year"
  | "2-years"
  | "5-years";

/** Valid historical period options */
const VALID_PERIOD_OPTIONS: ReadonlySet<string> = new Set([
  "3-months",
  "6-months",
  "this-year",
  "1-year",
  "2-years",
  "5-years",
]);

/** Check if a value is a valid historical period option */
function isValidPeriodOption(value: unknown): value is PeriodOption {
  return typeof value === "string" && VALID_PERIOD_OPTIONS.has(value);
}

/** Convert period string to date range (matches dashboard logic) */
function getPeriodDates(period: PeriodOption): { from: string; to: string } {
  const now = new Date();
  const to = format(now, "yyyy-MM-dd");

  switch (period) {
    case "3-months":
      return { from: format(subMonths(now, 3), "yyyy-MM-dd"), to };
    case "6-months":
      return { from: format(subMonths(now, 6), "yyyy-MM-dd"), to };
    case "this-year":
      return { from: format(startOfYear(now), "yyyy-MM-dd"), to };
    case "1-year":
      return { from: format(subYears(now, 1), "yyyy-MM-dd"), to };
    case "2-years":
      return { from: format(subYears(now, 2), "yyyy-MM-dd"), to };
    case "5-years":
      return { from: format(subYears(now, 5), "yyyy-MM-dd"), to };
    default:
      return { from: format(subYears(now, 1), "yyyy-MM-dd"), to };
  }
}

export interface ResolvedToolParams {
  from: string;
  to: string;
  currency?: string;
  revenueType?: "gross" | "net";
  [key: string]: unknown;
}

export interface ResolveToolParamsOptions {
  appContext: AppContext;
  aiParams: {
    period?: string;
    dateRange?: string;
    from?: string;
    to?: string;
    currency?: string | null;
    revenueType?: string;
    [key: string]: unknown;
  };
}

/**
 * Resolve tool parameters:
 * 1. AI params (user override)
 * 2. Fallback (1-year)
 */
export function resolveToolParams(
  options: ResolveToolParamsOptions,
): ResolvedToolParams {
  const { appContext, aiParams } = options;
  const { baseCurrency } = appContext;

  const historicalPeriod = isValidPeriodOption(aiParams.dateRange)
    ? aiParams.dateRange
    : isValidPeriodOption(aiParams.period)
      ? aiParams.period
      : undefined;

  let from: string;
  let to: string;

  if (historicalPeriod) {
    const dates = getPeriodDates(historicalPeriod);
    from = dates.from;
    to = dates.to;
  } else if (aiParams.from && aiParams.to) {
    from = aiParams.from;
    to = aiParams.to;
  } else {
    const dates = getPeriodDates("1-year");
    from = dates.from;
    to = dates.to;
  }

  const currency =
    (aiParams.currency !== null && aiParams.currency !== undefined
      ? aiParams.currency
      : undefined) ?? baseCurrency;

  const revenueType =
    (aiParams.revenueType as "gross" | "net") ?? "net";

  return {
    ...aiParams,
    from,
    to,
    currency,
    revenueType,
  };
}
