import {
  format,
  startOfMonth,
  startOfYear,
  subMonths,
  subWeeks,
} from "date-fns";
import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const chartTypeOptions = [
  "revenue",
  "profit",
  "burn_rate",
  "expense",
] as const;

export const chartPeriodOptions = [
  {
    value: "4w",
    label: "Last 4 weeks",
    range: {
      from: subWeeks(new Date(), 4),
      to: new Date(),
    },
  },
  {
    value: "3m",
    label: "Last 3 months",
    range: {
      from: subMonths(new Date(), 3),
      to: new Date(),
    },
  },
  {
    value: "6m",
    label: "Last 6 months",
    range: {
      from: subMonths(new Date(), 6),
      to: new Date(),
    },
  },
  {
    value: "12m",
    label: "Last 12 months",
    range: {
      from: subMonths(new Date(), 12),
      to: new Date(),
    },
  },
  {
    value: "mtd",
    label: "Month to date",
    range: {
      from: startOfMonth(new Date()),
      to: new Date(),
    },
  },
  {
    value: "ytd",
    label: "Year to date",
    range: {
      from: startOfYear(new Date()),
      to: new Date(),
    },
  },
  {
    value: "all",
    label: "All time",
    range: {
      // Can't get older data than this
      from: new Date("2020-01-01"),
      to: new Date(),
    },
  },
];

export const metricsParamsSchema = {
  from: parseAsString.withDefault(
    format(subMonths(startOfMonth(new Date()), 12), "yyyy-MM-dd"),
  ),
  to: parseAsString.withDefault(format(new Date(), "yyyy-MM-dd")),
  period: parseAsStringLiteral(
    chartPeriodOptions.map((option) => option.value),
  ).withDefault("12m"),
  chart: parseAsStringLiteral(chartTypeOptions).withDefault("revenue"),
};

export function useMetricsParams() {
  const [params, setParams] = useQueryStates(metricsParamsSchema);

  return {
    params,
    setParams,
  };
}

export const loadMetricsParams = createLoader(metricsParamsSchema);
