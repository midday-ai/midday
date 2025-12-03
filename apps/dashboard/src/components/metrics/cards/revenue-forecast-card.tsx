"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { RevenueForecastChart } from "@/components/charts/revenue-forecast-chart";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useOverviewTab } from "@/hooks/use-overview-tab";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { ShareMetricButton } from "../components/share-metric-button";

interface RevenueForecastCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
  revenueType?: "net" | "gross";
}

export function RevenueForecastCard({
  from,
  to,
  currency,
  locale,
  revenueType = "net",
}: RevenueForecastCardProps) {
  const trpc = useTRPC();
  const { isMetricsTab } = useOverviewTab();
  const { isCustomizing, setIsCustomizing } = useMetricsCustomize();
  const setInput = useChatStore((state) => state.setInput);
  const [isSelecting, setIsSelecting] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    threshold: 500,
    disabled: isCustomizing || isSelecting,
  });

  const { data: revenueForecastData } = useQuery({
    ...trpc.reports.revenueForecast.queryOptions({
      from,
      to,
      forecastMonths: 6,
      currency: currency,
      revenueType,
    }),
    enabled: isMetricsTab,
  });

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

  const forecastedRevenue =
    revenueForecastData?.summary?.totalProjectedRevenue ?? 0;

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

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
          <h3 className="text-sm font-normal text-muted-foreground">
            Revenue Forecast
          </h3>
          <div className="opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="revenue_forecast"
              from={from}
              to={to}
              currency={currency}
            />
          </div>
        </div>
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={forecastedRevenue}
            currency={currency || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{dateRangeDisplay}</p>
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
          locale={locale}
          forecastStartIndex={forecastStartIndex}
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
