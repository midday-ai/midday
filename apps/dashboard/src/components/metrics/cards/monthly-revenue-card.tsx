"use client";

import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { formatChartMonth } from "@/components/charts/chart-utils";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
import { ShareMetricButton } from "../components/share-metric-button";

interface MonthlyRevenueCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
  revenueType: "net" | "gross";
}

export function MonthlyRevenueCard({
  from,
  to,
  currency,
  locale,
  revenueType = "net",
}: MonthlyRevenueCardProps) {
  const trpc = useTRPC();
  const { isCustomizing, setIsCustomizing } = useMetricsCustomize();
  const setInput = useChatStore((state) => state.setInput);
  const [isSelecting, setIsSelecting] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    threshold: 500,
    disabled: isCustomizing || isSelecting,
  });

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
    <div
      className={cn(
        "border bg-background border-border p-6 flex flex-col h-full relative group",
        !isCustomizing && "cursor-pointer",
      )}
      {...longPressHandlers}
    >
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">Revenue</h3>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="monthly_revenue"
              from={from}
              to={to}
              currency={currency}
            />
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
        <MonthlyRevenueChart
          data={monthlyRevenueChartData}
          height={320}
          currency={currency}
          locale={locale}
          enableSelection={true}
          onSelectionStateChange={setIsSelecting}
          onSelectionComplete={(startDate, endDate, chartType) => {
            const message = generateChartSelectionMessage(
              startDate,
              endDate,
              chartType,
            );
            setInput(message);
          }}
        />
      </div>
    </div>
  );
}
