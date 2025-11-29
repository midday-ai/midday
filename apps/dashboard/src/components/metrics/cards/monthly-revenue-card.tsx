"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { ShareMetricButton } from "../components/share-metric-button";

interface MonthlyRevenueCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
  revenueType: "net" | "gross";
  isReady?: boolean;
}

export function MonthlyRevenueCard({
  from,
  to,
  currency,
  locale,
  revenueType = "net",
  isReady = true,
}: MonthlyRevenueCardProps) {
  const trpc = useTRPC();
  const currencyValue = currency ?? undefined;

  const { data: revenueData } = useQuery({
    ...trpc.reports.revenue.queryOptions({
      from,
      to,
      currency: currencyValue,
      revenueType,
    }),
    enabled: isReady,
  });

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

  const totalRevenue = useMemo(() => {
    return revenueData?.summary?.currentTotal ?? 0;
  }, [revenueData]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">Revenue</h3>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="monthly_revenue"
              from={from}
              to={to}
              currency={currencyValue}
            />
          </div>
        </div>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={totalRevenue}
            currency={currencyValue || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
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
          currency={currencyValue}
          locale={locale}
        />
      </div>
    </div>
  );
}
