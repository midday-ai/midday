"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { BurnRateChart } from "@/components/charts/burn-rate-chart";
import {
  CategoryExpenseDonutChart,
  grayShades,
} from "@/components/charts/category-expense-donut-chart";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { ProfitChart } from "@/components/charts/profit-chart";
import { RevenueForecastChart } from "@/components/charts/revenue-forecast-chart";
import { RunwayChart } from "@/components/charts/runway-chart";
import { StackedBarChart } from "@/components/charts/stacked-bar-chart";
import type { ReportType } from "@/components/metrics/utils/chart-types";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";

interface Report {
  id: string;
  linkId: string | null;
  type: string | null;
  from: string | null;
  to: string | null;
  currency: string | null;
  teamId: string | null;
  createdAt: string;
  expireAt: string | null;
}

interface PublicMetricViewProps {
  report: Report;
  chartName: string;
  dateRangeDisplay: string;
  className?: string;
}

export function PublicMetricView({
  report,
  chartName,
  dateRangeDisplay,
  className,
}: PublicMetricViewProps) {
  const type = report.type as ReportType;
  const linkId = report.linkId ?? "";

  return (
    <div>
      <div className="mb-6 flex flex-col items-start">
        <h2 className="text-xl font-medium font-serif">{chartName}</h2>
        <p className="text-sm text-muted-foreground mt-1">{dateRangeDisplay}</p>
      </div>
      <div className={cn("border bg-background border-border p-6", className)}>
        <ChartRenderer type={type} linkId={linkId} />
      </div>
    </div>
  );
}

interface ChartRendererProps {
  type: ReportType;
  linkId: string;
}

function ChartRenderer({ type, linkId }: ChartRendererProps) {
  switch (type) {
    case "burn_rate":
      return <BurnRateChartView linkId={linkId} />;
    case "monthly_revenue":
    case "revenue":
      return <MonthlyRevenueChartView linkId={linkId} />;
    case "profit":
      return <ProfitChartView linkId={linkId} />;
    case "expense":
      return <ExpensesChartView linkId={linkId} />;
    case "revenue_forecast":
      return <RevenueForecastChartView linkId={linkId} />;
    case "runway":
      return <RunwayChartView linkId={linkId} />;
    case "category_expenses":
      return <CategoryExpensesChartView linkId={linkId} />;
    default:
      return <div className="text-muted-foreground">Unknown chart type</div>;
  }
}

// Individual chart views - simplified versions for public display

function BurnRateChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const burnRateData =
    chartData?.type === "burn_rate"
      ? (chartData.data as Array<{
          date: string;
          value: number;
          currency: string;
        }>)
      : null;
  const currency = burnRateData?.[0]?.currency || "USD";

  const burnRateChartData = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return [];

    const values = burnRateData.map((item) => item.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return burnRateData.map((item) => ({
      month: format(parseISO(item.date), "MMM"),
      amount: item.value,
      average,
      currentBurn: item.value,
      averageBurn: average,
    }));
  }, [burnRateData]);

  const averageBurnRate = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return 0;
    const values = burnRateData.map((item) => item.value);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [burnRateData]);

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={averageBurnRate}
            currency={currency}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-foreground" />
            <span className="text-xs text-muted-foreground">Monthly</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-4 h-0.5"
              style={{ borderTop: "2px dashed hsl(var(--muted-foreground))" }}
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
        />
      </div>
    </>
  );
}

function MonthlyRevenueChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const revenueData =
    chartData?.type === "revenue" &&
    chartData.data &&
    typeof chartData.data === "object" &&
    "meta" in chartData.data
      ? (chartData.data as {
          summary: { currentTotal: number };
          meta: { currency?: string };
          result: Array<{
            date: string;
            current: { value: number };
            previous: { value: number };
          }>;
        })
      : null;
  const currency = revenueData?.meta?.currency || "USD";

  const monthlyRevenueChartData = useMemo(() => {
    if (!revenueData?.result || revenueData.result.length === 0) return [];

    const values = revenueData.result.map((item) => item.current.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return revenueData.result.map((item) => ({
      month: format(parseISO(item.date), "MMM"),
      amount: item.current.value,
      lastYearAmount: item.previous.value,
      average,
      currentRevenue: item.current.value,
      lastYearRevenue: item.previous.value,
      averageRevenue: average,
    }));
  }, [revenueData]);

  const totalRevenue = revenueData?.summary?.currentTotal ?? 0;

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={totalRevenue}
            currency={currency}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-foreground" />
            <span className="text-xs text-muted-foreground">This Year</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-2 h-2"
              style={{ backgroundColor: "var(--chart-bar-fill-secondary)" }}
            />
            <span className="text-xs text-muted-foreground">Last Year</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <MonthlyRevenueChart
          data={monthlyRevenueChartData}
          height={320}
          currency={currency}
        />
      </div>
    </>
  );
}

function ProfitChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const profitData =
    chartData?.type === "profit" &&
    chartData.data &&
    typeof chartData.data === "object" &&
    "meta" in chartData.data
      ? (chartData.data as {
          summary: { currentTotal: number };
          meta: { currency?: string };
          result: Array<{
            date: string;
            current: { date: string; value: number };
            previous: { value: number };
          }>;
        })
      : null;
  const currency = profitData?.meta?.currency || "USD";

  const profitChartData = useMemo(() => {
    if (!profitData?.result || profitData.result.length === 0) return [];

    const currentValues = profitData.result.map((item) => item.current.value);
    const average =
      currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;

    return profitData.result.map((item) => ({
      month: format(parseISO(item.date), "MMM"),
      profit: item.current.value,
      lastYearProfit: item.previous.value,
      average,
    }));
  }, [profitData]);

  const totalProfit = profitData?.summary?.currentTotal ?? 0;

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={totalProfit}
            currency={currency}
            maximumFractionDigits={0}
          />
        </p>
      </div>
      <div className="h-80">
        <ProfitChart data={profitChartData} height={320} currency={currency} />
      </div>
    </>
  );
}

function ExpensesChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const expenseData =
    chartData?.type === "expense" &&
    chartData.data &&
    typeof chartData.data === "object" &&
    "meta" in chartData.data
      ? (chartData.data as {
          summary: { averageExpense: number };
          meta: { currency?: string };
          result: Array<{ date: string; value: number }>;
        })
      : null;
  const currency = expenseData?.meta?.currency || "USD";

  const averageExpense = expenseData?.summary?.averageExpense ?? 0;

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={averageExpense}
            currency={currency}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 flex items-center justify-center">
              <Icons.DotRaster />
            </div>
            <span className="text-xs text-muted-foreground">Recurring</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        {expenseData?.result && expenseData.result.length > 0 ? (
          <StackedBarChart data={expenseData} height={320} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No expense data available
          </div>
        )}
      </div>
    </>
  );
}

function RevenueForecastChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const revenueForecastData =
    chartData?.type === "revenue_forecast" &&
    chartData.data &&
    typeof chartData.data === "object" &&
    "meta" in chartData.data
      ? (chartData.data as {
          meta: { currency?: string };
          historical: Array<{ date: string; value: number }>;
          forecast: Array<{ date: string; value: number }>;
          summary: { totalProjectedRevenue: number };
        })
      : null;
  const currency = revenueForecastData?.meta?.currency || "USD";

  const revenueForecastChartData = useMemo(() => {
    if (!revenueForecastData) return [];

    const historical = revenueForecastData.historical || [];
    const forecast = revenueForecastData.forecast || [];

    return [
      ...historical.map((item, index) => ({
        month: format(parseISO(item.date), "MMM"),
        actual: item.value,
        forecasted: index === historical.length - 1 ? item.value : null,
        date: item.date,
      })),
      ...forecast.map((item) => ({
        month: format(parseISO(item.date), "MMM"),
        actual: null,
        forecasted: item.value,
        date: item.date,
      })),
    ];
  }, [revenueForecastData]);

  const forecastStartIndex = useMemo(() => {
    if (!revenueForecastData?.historical) return -1;
    return revenueForecastData.historical.length - 1;
  }, [revenueForecastData]);

  const forecastedRevenue =
    revenueForecastData?.summary?.totalProjectedRevenue ?? 0;

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={forecastedRevenue}
            currency={currency}
            maximumFractionDigits={0}
          />
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
            <span className="text-xs text-muted-foreground">Forecast</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <RevenueForecastChart
          data={revenueForecastChartData}
          height={320}
          currency={currency}
          forecastStartIndex={forecastStartIndex}
        />
      </div>
    </>
  );
}

function RunwayChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();
  const [displayRunway, setDisplayRunway] = useState<number>(0);
  const displayRunwayRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const runwayChartResponse =
    chartData?.type === "runway"
      ? (chartData.data as {
          runway: number;
          burnRate: Array<{ date: string; value: number; currency: string }>;
        })
      : null;
  const runwayData = runwayChartResponse?.runway ?? null;
  const burnRateData = runwayChartResponse?.burnRate ?? null;
  const currency = burnRateData?.[0]?.currency || "USD";

  // Cash balance can't be fetched without auth, so we'll estimate from runway * burn rate
  const cashBalanceData = null;

  const runwayChartData = useMemo<
    Array<{
      month: string;
      cashRemaining: number;
      burnRate: number;
      projectedCash?: number;
      runwayMonths: number;
    }>
  >(() => {
    if (!runwayData || typeof runwayData !== "number") return [];

    const burnRateAvg =
      burnRateData && burnRateData.length > 0
        ? burnRateData.reduce((sum, item) => sum + item.value, 0) /
          burnRateData.length
        : 0;

    if (burnRateAvg <= 0 || !Number.isFinite(burnRateAvg)) return [];

    // Estimate cash balance from runway * burn rate (can't fetch account balances without auth)
    const currentCashBalance = runwayData * burnRateAvg;

    if (!Number.isFinite(currentCashBalance)) return [];

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

      if (!Number.isFinite(projectedRunwayMonths)) continue;

      projections.push({
        month: i === 0 ? "Now" : `+${i}mo`,
        cashRemaining: remainingCash,
        burnRate: burnRateAvg,
        projectedCash: i > 0 ? remainingCash : undefined,
        runwayMonths: projectedRunwayMonths,
      });

      if (projectedRunwayMonths <= 0) break;
    }

    return projections;
  }, [runwayData, burnRateData, cashBalanceData]);

  const currentRunway = typeof runwayData === "number" ? runwayData : 0;

  useEffect(() => {
    if (
      currentRunway !== undefined &&
      currentRunway !== null &&
      !Number.isNaN(currentRunway)
    ) {
      if (!hasInitializedRef.current) {
        displayRunwayRef.current = currentRunway;
        setDisplayRunway(currentRunway);
        hasInitializedRef.current = true;
        return;
      }
      displayRunwayRef.current = currentRunway;
      setDisplayRunway(currentRunway);
    }
  }, [currentRunway]);

  const hasNoData = runwayChartData.length === 0;

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal">
          <NumberFlow
            value={displayRunway}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            willChange
            locales="en"
          />{" "}
          months
        </p>
      </div>
      <div className="h-80">
        {hasNoData ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-xs text-muted-foreground text-center px-4">
              Unable to calculate runway.
            </div>
          </div>
        ) : (
          <RunwayChart
            data={runwayChartData}
            height={320}
            currency={currency}
            displayMode="months"
          />
        )}
      </div>
    </>
  );
}

function CategoryExpensesChartView({ linkId }: { linkId: string }) {
  const trpc = useTRPC();

  const { data: chartData } = useQuery(
    trpc.reports.getChartDataByLinkId.queryOptions({ linkId }),
  );

  const spendingData =
    chartData?.type === "category_expenses"
      ? (chartData.data as Array<{
          name: string;
          amount: number;
          currency: string;
        }>)
      : null;
  const currency = spendingData?.[0]?.currency || "USD";

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

  const totalExpenses = categoryDonutChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <>
      <div className="mb-4">
        <p className="text-3xl font-normal">
          {formatAmount({
            amount: totalExpenses,
            currency,
            maximumFractionDigits: 0,
          })}
        </p>
        {categoryDonutChartData.length > 0 && (
          <div className="flex gap-4 items-center mt-2 flex-wrap">
            {categoryDonutChartData.slice(0, 3).map((item, idx) => (
              <div key={item.category} className="flex gap-2 items-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: grayShades[idx % grayShades.length],
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
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No expense data available
          </div>
        )}
      </div>
    </>
  );
}
