"use client";

import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { formatChartMonth } from "@/components/charts/chart-utils";
import { RevenueForecastChart } from "@/components/charts/revenue-forecast-chart";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
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
  const { isCustomizing, setIsCustomizing } = useMetricsCustomize();
  const setInput = useChatStore((state) => state.setInput);
  const [isSelecting, setIsSelecting] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    threshold: 500,
    disabled: isCustomizing || isSelecting,
  });

  const { data: revenueForecastData } = useQuery(
    trpc.reports.revenueForecast.queryOptions({
      from,
      to,
      forecastMonths: 6,
      currency: currency,
      revenueType,
    }),
  );

  // Transform revenue forecast data with enhanced fields
  const revenueForecastChartData = useMemo(() => {
    if (!revenueForecastData) return [];

    const historical = revenueForecastData.historical || [];
    const forecast = revenueForecastData.forecast || [];
    const totalMonths = historical.length + forecast.length;

    return [
      ...historical.map((item, index) => ({
        month: formatChartMonth(item.date, totalMonths),
        actual: item.value,
        // Set forecasted value on the last historical point to same as actual to connect the lines
        forecasted: index === historical.length - 1 ? item.value : null,
        date: item.date,
        // Historical points don't have confidence data
        optimistic: null,
        pessimistic: null,
        confidence: null,
        breakdown: null,
      })),
      ...forecast.map((item) => ({
        month: formatChartMonth(item.date, totalMonths),
        actual: null,
        forecasted: item.value,
        date: item.date,
        optimistic: item.optimistic ?? null,
        pessimistic: item.pessimistic ?? null,
        confidence: item.confidence ?? null,
        breakdown: item.breakdown ?? null,
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

  // Get confidence score from new bottom-up forecast meta
  const confidenceScore = useMemo(() => {
    const meta = revenueForecastData?.meta;
    if (meta && "confidenceScore" in meta) {
      return meta.confidenceScore as number;
    }
    return null;
  }, [revenueForecastData]);

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
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
          {confidenceScore !== null && (
            <div className="flex gap-1 items-center ml-auto">
              <span className="text-xs text-muted-foreground">
                {confidenceScore}% confidence
              </span>
            </div>
          )}
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
