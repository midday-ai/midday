"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function RevenueForecastWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  // Get 12 months of historical data and forecast 6 months ahead
  // 12 months captures full year cycle and seasonality for better accuracy
  const historicalMonths = 12;
  const forecastMonths = 6;

  const getDateRange = () => {
    const to = endOfMonth(new Date());
    const from = startOfMonth(subMonths(to, historicalMonths - 1));
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  };

  const dateRange = getDateRange();

  const { data, isLoading } = useQuery({
    ...trpc.reports.revenueForecast.queryOptions({
      from: dateRange.from,
      to: dateRange.to,
      forecastMonths,
      currency: team?.baseCurrency ?? undefined,
      revenueType: "net",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewDetails = () => {
    // TODO: Navigate to detailed forecast page
    console.log("View forecast details clicked");
  };

  // Prepare data for simple trend line chart
  // Show last 6 months of actual + all forecast months for better context
  const chartData = data?.combined
    ? [
        // Last 6 actual months
        ...data.historical.slice(-6).map((item) => ({
          month: format(new Date(item.date), "MMM"),
          value: item.value,
          type: "actual",
        })),
        // All forecast months
        ...data.forecast.map((item) => ({
          month: format(new Date(item.date), "MMM"),
          value: item.value,
          type: "forecast",
        })),
      ]
    : [];

  const nextMonthProjection = data?.summary.nextMonthProjection ?? 0;
  const currency = data?.summary.currency || team?.baseCurrency || "USD";

  return (
    <BaseWidget
      title="Forecast"
      icon={<Icons.TrendingUp className="size-4" />}
      description={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#878787]">Revenue projection</p>

          {/* Simple trend line chart */}
          {!isLoading && chartData.length > 0 ? (
            <div className="h-12 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 1 }}
                >
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={false}
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

          <p className="text-sm text-[#666666]">
            Next month projection{" "}
            <span className="font-medium text-foreground">
              +<FormatAmount amount={nextMonthProjection} currency={currency} />
            </span>
          </p>

          <button
            type="button"
            onClick={handleViewDetails}
            className="text-xs text-[#878787] hover:text-foreground text-left transition-colors"
          >
            View forecast details
          </button>
        </div>
      }
      actions=""
      onClick={handleViewDetails}
    >
      <div />
    </BaseWidget>
  );
}
