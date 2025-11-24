import { MetricsView } from "@/components/metrics/metrics-view";
import { loadMetricsParams } from "@/hooks/use-metrics-params";
import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import { format, subMonths, subYears } from "date-fns";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";

export const metadata: Metadata = {
  title: "Metrics | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

function calculateDateRange(
  timePeriod: string,
  fiscalYearStartMonth?: number | null,
  yearType: "fiscal" | "real" = "real",
): { from: string; to: string } {
  const now = new Date();
  const to = format(now, "yyyy-MM-dd");

  let from: Date;

  switch (timePeriod) {
    case "3 months":
      from = subMonths(now, 3);
      break;
    case "6 months":
      from = subMonths(now, 6);
      break;
    case "1 year":
      from = subYears(now, 1);
      break;
    case "2 years":
      from = subYears(now, 2);
      break;
    case "5 years":
      from = subYears(now, 5);
      break;
    default:
      from = subMonths(now, 6);
  }

  // If fiscal year and fiscalYearStartMonth is set, adjust the date range
  if (
    yearType === "fiscal" &&
    fiscalYearStartMonth !== null &&
    fiscalYearStartMonth !== undefined
  ) {
    const currentMonth = now.getMonth();
    const fiscalStartMonth = fiscalYearStartMonth - 1; // Convert to 0-indexed

    // Calculate fiscal year start date
    let fiscalYearStart: Date;
    if (currentMonth >= fiscalStartMonth) {
      // Current fiscal year started this calendar year
      fiscalYearStart = new Date(now.getFullYear(), fiscalStartMonth, 1);
    } else {
      // Current fiscal year started last calendar year
      fiscalYearStart = new Date(now.getFullYear() - 1, fiscalStartMonth, 1);
    }

    // Adjust 'from' date to align with fiscal year if needed
    if (from < fiscalYearStart) {
      from = fiscalYearStart;
    }
  }

  return {
    from: format(from, "yyyy-MM-dd"),
    to,
  };
}

export default async function MetricsPage(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;
  const params = loadMetricsParams(searchParams);

  // Get team data for currency and fiscal year settings
  const team = await queryClient.fetchQuery(trpc.team.current.queryOptions());

  const { from, to } = calculateDateRange(
    params["time-period"],
    team?.fiscalYearStartMonth,
    params["year-type"],
  );

  const currency = team?.baseCurrency ?? undefined;
  const revenueType = params["revenue-type"];

  // Prefetch all metrics queries
  batchPrefetch([
    trpc.reports.burnRate.queryOptions({
      from,
      to,
      currency,
    }),
    trpc.reports.profit.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
    trpc.reports.revenueForecast.queryOptions({
      from,
      to,
      forecastMonths: 6,
      currency,
      revenueType,
    }),
    trpc.reports.runway.queryOptions({
      from,
      to,
      currency,
    }),
    trpc.reports.expense.queryOptions({
      from,
      to,
      currency,
    }),
    trpc.reports.spending.queryOptions({
      from,
      to,
      currency,
    }),
    trpc.widgets.getAccountBalances.queryOptions({
      currency,
    }),
  ]);

  return (
    <HydrateClient>
      <MetricsView />
    </HydrateClient>
  );
}
