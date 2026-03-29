"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { formatChartMonth } from "@/components/charts/chart-utils";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { useTRPC } from "@/trpc/client";
import { ChartFadeIn } from "../components/chart-loading-overlay";
import { DragIndicator } from "../components/drag-indicator";
import { ShareMetricButton } from "../components/share-metric-button";

interface MonthlyRevenueCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  revenueType: "net" | "gross";
  isCustomizing?: boolean;
}

export function MonthlyRevenueCard({
  from,
  to,
  currency,
  locale,
  revenueType = "net",
  isCustomizing,
}: MonthlyRevenueCardProps) {
  const trpc = useTRPC();

  const { data: revenueData } = useQuery(
    trpc.reports.revenue.queryOptions({
      from,
      to,
      currency: currency,
      revenueType,
    }),
  );

  // Transform revenue data
  const monthlyRevenueChartData = useMemo(() => {
    if (!revenueData?.result || revenueData.result.length === 0) return [];

    const values = revenueData.result.map((item) => item.current.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    const totalMonths = revenueData.result.length;

    return revenueData.result.map((item) => ({
      month: formatChartMonth(item.date, totalMonths),
      amount: item.current.value,
      lastYearAmount: item.previous.value,
      average,
      currentRevenue: item.current.value,
      lastYearRevenue: item.previous.value,
      averageRevenue: average,
    }));
  }, [revenueData]);

  const totalRevenue = useMemo(() => {
    return revenueData?.summary?.currentTotal ?? 0;
  }, [revenueData]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">Revenue</h3>
          <div
            className={
              isCustomizing
                ? "flex items-center gap-2"
                : "flex items-center gap-2 opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity"
            }
          >
            {isCustomizing ? (
              <DragIndicator />
            ) : (
              <ShareMetricButton
                type="monthly_revenue"
                from={from}
                to={to}
                currency={currency}
              />
            )}
          </div>
        </div>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={totalRevenue}
            currency={currency || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-foreground" />
            <span className="text-xs text-muted-foreground">Current</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-2 h-2"
              style={{
                backgroundColor: "var(--chart-bar-fill-secondary)",
              }}
            />
            <span className="text-xs text-muted-foreground">Previous</span>
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
        {monthlyRevenueChartData.length > 0 ? (
          <ChartFadeIn>
            <MonthlyRevenueChart
              data={monthlyRevenueChartData}
              height={320}
              currency={currency}
              locale={locale}
            />
          </ChartFadeIn>
        ) : null}
      </div>
    </div>
  );
}
