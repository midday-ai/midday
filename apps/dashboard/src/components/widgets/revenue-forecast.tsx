"use client";

import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RevenueForecastWidget() {
  const trpc = useTRPC();
  const { from, to, revenueType, currency } = useMetricsFilter();

  const forecastMonths = 6;

  const { data, isLoading } = useQuery({
    ...trpc.reports.revenueForecast.queryOptions({
      from,
      to,
      forecastMonths,
      currency,
      revenueType,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Forecast"
        icon={<Icons.TrendingUp className="size-4" />}
        descriptionLines={3}
      />
    );
  }

  // Prepare data for simple trend line chart
  // Show last 6 months of actual + all forecast months for better context
  const chartData = data?.combined
    ? [
        // Last 6 actual months
        ...data.historical.slice(-6).map((item) => ({
          month: format(parseISO(item.date), "MMM"),
          value: item.value,
          type: "actual",
        })),
        // All forecast months
        ...data.forecast.map((item) => ({
          month: format(parseISO(item.date), "MMM"),
          value: item.value,
          type: "forecast",
        })),
      ]
    : [];

  const nextMonthProjection = data?.summary?.nextMonthProjection ?? 0;

  return (
    <BaseWidget
      title="Forecast"
      icon={<Icons.TrendingUp className="size-4" />}
      description={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#666666]">Revenue projection</p>

          {/* Simple trend line chart */}
          {chartData.length > 0 ? (
            <div className="w-full">
              <ResponsiveContainer width="100%" height={48}>
                <LineChart
                  data={chartData}
                  margin={{ top: 1, right: 0, left: 0, bottom: 1 }}
                >
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-12 w-full flex items-center">
              <div className="text-xs text-muted-foreground">
                No data available
              </div>
            </div>
          )}

          {data?.summary && (
            <p className="text-sm text-[#666666]">
              Next month projection{" "}
              <span className="font-medium text-foreground">
                +
                <FormatAmount
                  amount={nextMonthProjection}
                  currency={currency || "USD"}
                />
              </span>
            </p>
          )}
        </div>
      }
    >
      <div />
    </BaseWidget>
  );
}
