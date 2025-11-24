"use client";

import { BurnRateChart } from "@/components/charts/burn-rate-chart";
import { CategoryExpenseDonutChart } from "@/components/charts/category-expense-donut-chart";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { ProfitChart } from "@/components/charts/profit-chart";
import { RevenueForecastChart } from "@/components/charts/revenue-forecast-chart";
import { RunwayChart } from "@/components/charts/runway-chart";
import { useMetricsParams } from "@/hooks/use-metrics-params";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, subYears } from "date-fns";
import { useMemo } from "react";

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

export function MetricsView() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const { revenueType, yearType, timePeriod, setParams } = useMetricsParams();

  const { from, to } = useMemo(() => {
    return calculateDateRange(timePeriod, team?.fiscalYearStartMonth, yearType);
  }, [timePeriod, team?.fiscalYearStartMonth, yearType]);

  const currency = team?.baseCurrency ?? undefined;
  const locale = user?.locale ?? undefined;

  // Fetch all metrics data
  const { data: burnRateData } = useQuery(
    trpc.reports.burnRate.queryOptions({
      from,
      to,
      currency,
    }),
  );

  const { data: profitData } = useQuery(
    trpc.reports.profit.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
  );

  const { data: revenueData } = useQuery(
    trpc.reports.revenue.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
  );

  const { data: revenueForecastData } = useQuery(
    trpc.reports.revenueForecast.queryOptions({
      from,
      to,
      forecastMonths: 6,
      currency,
      revenueType,
    }),
  );

  const { data: runwayData } = useQuery(
    trpc.reports.runway.queryOptions({
      from,
      to,
      currency,
    }),
  );

  // Fetch cash balance for runway chart
  const { data: cashBalanceData } = useQuery(
    trpc.widgets.getAccountBalances.queryOptions({
      currency,
    }),
  );

  // Transform burn rate data
  const burnRateChartData = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return [];

    const values = burnRateData.map((item) => item.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return burnRateData.map((item) => ({
      month: format(new Date(item.date), "MMM"),
      amount: item.value,
      average,
      currentBurn: item.value,
      averageBurn: average,
    }));
  }, [burnRateData]);

  // Transform revenue data
  const monthlyRevenueChartData = useMemo(() => {
    if (!revenueData?.result || revenueData.result.length === 0) return [];

    const values = revenueData.result.map((item) => item.current.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return revenueData.result.map((item) => ({
      month: format(new Date(item.date), "MMM"),
      amount: item.current.value,
      lastYearAmount: item.previous.value,
      average,
      currentRevenue: item.current.value,
      lastYearRevenue: item.previous.value,
      averageRevenue: average,
    }));
  }, [revenueData]);

  // Transform profit data - need to get previous year data
  const profitChartData = useMemo(() => {
    if (!profitData?.result || profitData.result.length === 0) return [];

    const currentValues = profitData.result.map((item) => item.current.value);
    const average =
      currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;

    return profitData.result.map((item, index) => ({
      month: format(new Date(item.current.date), "MMM"),
      profit: item.current.value,
      lastYearProfit: item.previous.value,
      average,
    }));
  }, [profitData]);

  // Transform revenue forecast data
  const revenueForecastChartData = useMemo(() => {
    if (!revenueForecastData) return [];

    const historical = revenueForecastData.historical || [];
    const forecast = revenueForecastData.forecast || [];

    return [
      ...historical.map((item, index) => ({
        month: format(new Date(item.date), "MMM"),
        actual: item.value,
        // Set forecasted value on the last historical point to same as actual to connect the lines
        forecasted: index === historical.length - 1 ? item.value : null,
        date: item.date,
      })),
      ...forecast.map((item) => ({
        month: format(new Date(item.date), "MMM"),
        actual: null,
        forecasted: item.value,
        date: item.date,
      })),
    ];
  }, [revenueForecastData]);

  // Calculate forecast start index
  const forecastStartIndex = useMemo(() => {
    if (!revenueForecastData?.historical) return -1;
    return revenueForecastData.historical.length - 1;
  }, [revenueForecastData]);

  // Transform runway data - need to calculate monthly projections
  const runwayChartData = useMemo<
    Array<{
      month: string;
      cashRemaining: number;
      burnRate: number;
      projectedCash?: number;
      runwayMonths: number;
    }>
  >(() => {
    if (!runwayData || typeof runwayData !== "number") {
      return [];
    }

    const burnRateAvg =
      burnRateData && burnRateData.length > 0
        ? burnRateData.reduce((sum, item) => sum + item.value, 0) /
          burnRateData.length
        : 0;

    // Return empty array if burn rate is 0 or invalid
    if (burnRateAvg <= 0 || !Number.isFinite(burnRateAvg)) {
      return [];
    }

    // Get current cash balance from account balances or estimate from runway
    const currentCashBalance =
      cashBalanceData?.result?.totalBalance ?? runwayData * burnRateAvg;

    // Return empty array if cash balance is invalid (but allow 0 for edge cases)
    if (!Number.isFinite(currentCashBalance)) {
      return [];
    }

    // Generate monthly projections
    const projections: Array<{
      month: string;
      cashRemaining: number;
      burnRate: number;
      projectedCash?: number;
      runwayMonths: number;
    }> = [];

    for (let i = 0; i <= 8; i++) {
      const monthsFromNow = i;
      const remainingCash = Math.max(
        0,
        currentCashBalance - burnRateAvg * monthsFromNow,
      );
      const projectedRunwayMonths =
        burnRateAvg > 0 ? remainingCash / burnRateAvg : 0;

      // Skip if runwayMonths is invalid
      if (!Number.isFinite(projectedRunwayMonths)) continue;

      projections.push({
        month: i === 0 ? "Now" : `+${i}M`,
        cashRemaining: remainingCash,
        burnRate: burnRateAvg,
        projectedCash: i > 0 ? remainingCash : undefined,
        runwayMonths: projectedRunwayMonths,
      });

      // Stop adding projections once runway reaches 0
      if (projectedRunwayMonths <= 0) break;
    }

    return projections;
  }, [runwayData, burnRateData, cashBalanceData]);

  // Transform expense data to category donut chart format
  const categoryExpenseChartData = useMemo(() => {
    // We need to use spending data for categories, not expense data
    // Expense data is monthly totals, spending is by category
    return [];
  }, []);

  // Get spending data for categories
  const { data: spendingData } = useQuery(
    trpc.reports.spending.queryOptions({
      from,
      to,
      currency,
    }),
  );

  const categoryDonutChartData = useMemo(() => {
    if (!spendingData || spendingData.length === 0) return [];

    const total = spendingData.reduce(
      (sum, item) => sum + Math.abs(item.amount),
      0,
    );

    return spendingData.slice(0, 5).map((item) => ({
      category: item.name,
      amount: Math.abs(item.amount),
      percentage: total > 0 ? (Math.abs(item.amount) / total) * 100 : 0,
    }));
  }, [spendingData]);

  // Format date range for display
  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

  // Calculate summary values - ensure consistent rendering between server and client
  const currentBurnRate = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return 0;
    return burnRateData[burnRateData.length - 1]!.value;
  }, [burnRateData]);

  const currentRevenue = useMemo(() => {
    if (!revenueData?.result || revenueData.result.length === 0) return 0;
    return revenueData.result[revenueData.result.length - 1]!.current.value;
  }, [revenueData]);

  const totalProfit = profitData?.summary?.currentTotal ?? 0;

  const forecastedRevenue =
    revenueForecastData?.summary?.totalProjectedRevenue ?? 0;

  const currentRunway = typeof runwayData === "number" ? runwayData : 0;

  const totalExpenses = categoryDonutChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-2xl font-normal mb-1 font-serif">Metrics</h1>
          <p className="text-sm text-muted-foreground">{dateRangeDisplay}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Icons.Filter size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Revenue Type</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={revenueType}
                onValueChange={(value) =>
                  setParams({ revenueType: value as "net" | "gross" })
                }
              >
                <DropdownMenuRadioItem value="net">Net</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="gross">
                  Gross
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Year Type</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={yearType}
                onValueChange={(value) =>
                  setParams({ yearType: value as "fiscal" | "real" })
                }
              >
                <DropdownMenuRadioItem value="real">Real</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fiscal">
                  Fiscal
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time Period Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Icons.CalendarMonth size={16} />
                <span>{timePeriod}</span>
                <Icons.ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup
                value={timePeriod}
                onValueChange={(value) =>
                  setParams({
                    timePeriod: value as
                      | "3 months"
                      | "6 months"
                      | "1 year"
                      | "2 years"
                      | "5 years",
                  })
                }
              >
                <DropdownMenuRadioItem value="3 months">
                  3 months
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="6 months">
                  6 months
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="1 year">
                  1 year
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="2 years">
                  2 years
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="5 years">
                  5 years
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="space-y-8 pb-8">
        {/* Monthly Revenue - Full Width */}
        <div className="border bg-background border-border p-6">
          <div className="mb-4">
            <h3 className="text-sm font-normal mb-1 text-muted-foreground">
              Monthly Revenue
            </h3>
            <p className="text-3xl font-normal mb-3">
              {formatAmount({
                amount: currentRevenue,
                currency: currency || "USD",
                locale,
                maximumFractionDigits: 0,
              })}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-foreground" />
                <span className="text-xs text-muted-foreground">This Year</span>
              </div>
              <div className="flex gap-2 items-center">
                <div
                  className="w-2 h-2"
                  style={{
                    backgroundColor: "var(--chart-bar-fill-secondary)",
                  }}
                />
                <span className="text-xs text-muted-foreground">Last Year</span>
              </div>
              <div className="flex gap-2 items-center">
                <div
                  className="w-4 h-0.5"
                  style={{
                    borderTop: "2px dashed hsl(var(--muted-foreground))",
                  }}
                />
                <span className="text-xs text-muted-foreground">Average</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <MonthlyRevenueChart
              data={monthlyRevenueChartData}
              height={320}
              currency={currency}
              locale={locale}
            />
          </div>
        </div>

        {/* Burn Rate - Full Width */}
        <div className="border bg-background border-border p-6">
          <div className="mb-4">
            <h3 className="text-sm font-normal mb-1 text-muted-foreground">
              Monthly Burn Rate
            </h3>
            <p className="text-3xl font-normal mb-3">
              {formatAmount({
                amount: currentBurnRate,
                currency: currency || "USD",
                locale,
                maximumFractionDigits: 0,
              })}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-foreground" />
                <span className="text-xs text-muted-foreground">Current</span>
              </div>
              <div className="flex gap-2 items-center">
                <div
                  className="w-4 h-0.5"
                  style={{
                    borderTop: "2px dashed hsl(var(--muted-foreground))",
                  }}
                />
                <span className="text-xs text-muted-foreground">Average</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <BurnRateChart
              data={burnRateChartData}
              height={320}
              currency={currency}
              locale={locale}
            />
          </div>
        </div>

        {/* Profit Analysis and Revenue Forecast - Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profit Analysis */}
          <div className="border bg-background border-border p-6">
            <div className="mb-4">
              <h3 className="text-sm font-normal mb-1 text-muted-foreground">
                Profit & Loss
              </h3>
              <p className="text-3xl font-normal">
                {formatAmount({
                  amount: totalProfit,
                  currency: currency || "USD",
                  locale,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {dateRangeDisplay}
              </p>
            </div>
            <div className="h-80">
              <ProfitChart
                data={profitChartData}
                height={320}
                currency={currency}
                locale={locale}
              />
            </div>
          </div>

          {/* Revenue Forecast */}
          <div className="border bg-background border-border p-6">
            <div className="mb-4">
              <h3 className="text-sm font-normal mb-1 text-muted-foreground">
                Revenue Forecast
              </h3>
              <p className="text-3xl font-normal">
                {formatAmount({
                  amount: forecastedRevenue,
                  currency: currency || "USD",
                  locale,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {dateRangeDisplay}
              </p>
              <div className="flex gap-4 items-center mt-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-0.5 bg-foreground" />
                  <span className="text-xs text-muted-foreground">Actual</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-4 h-0.5"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, hsl(var(--muted-foreground)), hsl(var(--muted-foreground)) 4px, transparent 4px, transparent 8px)",
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Forecast
                  </span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <RevenueForecastChart
                data={revenueForecastChartData}
                height={320}
                currency={currency}
                locale={locale}
                forecastStartIndex={forecastStartIndex}
              />
            </div>
          </div>
        </div>

        {/* Runway and Category Expenses - Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Runway */}
          <div className="border bg-background border-border p-6">
            <div className="mb-4">
              <h3 className="text-sm font-normal mb-1 text-muted-foreground">
                Runway
              </h3>
              <p className="text-3xl font-normal">
                {currentRunway.toFixed(1)} months
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {dateRangeDisplay}
              </p>
            </div>
            <div className="h-80">
              <RunwayChart
                data={runwayChartData}
                height={320}
                currency={currency}
                locale={locale}
                displayMode="months"
              />
            </div>
          </div>

          {/* Category Expense Breakdown */}
          <div className="border bg-background border-border p-6">
            <div className="mb-4">
              <h3 className="text-sm font-normal mb-1 text-muted-foreground">
                Category Expense Breakdown
              </h3>
              <p className="text-3xl font-normal">
                {formatAmount({
                  amount: totalExpenses,
                  currency: currency || "USD",
                  locale,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {dateRangeDisplay}
              </p>
              {categoryDonutChartData.length > 0 && (
                <div className="flex gap-4 items-center mt-2 flex-wrap">
                  {categoryDonutChartData.slice(0, 3).map((item, index) => (
                    <div
                      key={item.category}
                      className="flex gap-2 items-center"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            index === 0
                              ? "#ffffff"
                              : index === 1
                                ? "#707070"
                                : "#666666",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-80">
              {categoryDonutChartData.length > 0 ? (
                <CategoryExpenseDonutChart
                  data={categoryDonutChartData}
                  height={320}
                  currency={currency}
                  locale={locale}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No expense data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
