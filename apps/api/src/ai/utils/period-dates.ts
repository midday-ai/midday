import type { AppContext } from "@api/ai/agents/config/shared";
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
  toolName: string;
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
 * Resolve tool parameters with priority:
 * 1. Forced params (widget click)
 * 2. AI params (user override)
 * 3. Dashboard metricsFilter
 * 4. Fallback (1-year)
 */
export function resolveToolParams(
  options: ResolveToolParamsOptions,
): ResolvedToolParams {
  const { toolName, appContext, aiParams } = options;
  const { forcedToolCall, metricsFilter, baseCurrency } = appContext;

  // 1. FORCED PARAMS: Widget click → use exact params (bypasses AI)
  if (forcedToolCall?.toolName === toolName && forcedToolCall.toolParams) {
    const forced = forcedToolCall.toolParams;
    return {
      ...forced,
      from:
        (forced.from as string) ??
        metricsFilter?.from ??
        getPeriodDates("1-year").from,
      to:
        (forced.to as string) ??
        metricsFilter?.to ??
        getPeriodDates("1-year").to,
      currency:
        (forced.currency as string) ?? metricsFilter?.currency ?? baseCurrency,
      revenueType:
        (forced.revenueType as "gross" | "net") ??
        metricsFilter?.revenueType ??
        "net",
    };
  }

  // 2. AI PARAMS + METRICS FILTER FALLBACK
  // Priority: AI explicit > metricsFilter > hardcoded default

  // Handle historical date range:
  // - Some tools use 'period' for historical period (e.g., get-expenses)
  // - Others use 'dateRange' for historical period and 'period' for aggregation (e.g., getCashFlow uses 'period' for "monthly"/"quarterly")
  // Only consider values that are valid historical periods (e.g., "1-year", "6-months")
  // Ignore aggregation values like "monthly", "quarterly", "yearly"
  const historicalPeriod = isValidPeriodOption(aiParams.dateRange)
    ? aiParams.dateRange
    : isValidPeriodOption(aiParams.period)
      ? aiParams.period
      : undefined;

  let from: string;
  let to: string;

  if (historicalPeriod) {
    // AI specified a valid historical period - convert to dates
    const dates = getPeriodDates(historicalPeriod);
    from = dates.from;
    to = dates.to;
  } else if (aiParams.from && aiParams.to) {
    // AI specified explicit dates
    from = aiParams.from;
    to = aiParams.to;
  } else if (metricsFilter?.from && metricsFilter?.to) {
    // Use dashboard filter state as default
    from = metricsFilter.from;
    to = metricsFilter.to;
  } else {
    // Fallback to 1-year
    const dates = getPeriodDates("1-year");
    from = dates.from;
    to = dates.to;
  }

  // Currency: AI > metricsFilter > baseCurrency
  const currency =
    (aiParams.currency !== null && aiParams.currency !== undefined
      ? aiParams.currency
      : undefined) ??
    metricsFilter?.currency ??
    baseCurrency;

  // Revenue type: AI > metricsFilter > "net"
  const revenueType =
    (aiParams.revenueType as "gross" | "net") ??
    metricsFilter?.revenueType ??
    "net";

  // Return resolved params, passing through any other AI params
  return {
    ...aiParams,
    from,
    to,
    currency,
    revenueType,
  };
}
