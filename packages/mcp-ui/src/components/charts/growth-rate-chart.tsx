"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCompact, formatMonth } from "@/utils/format";
import { commonChartConfig, calculateChartMargin } from "@/utils/chart-config";
import { InlineLegend } from "@/components/base";

export interface GrowthRateDataItem {
  date: string;
  value: number;
}

export interface GrowthRateSummary {
  currentTotal: number;
  previousTotal: number;
  growthRate: number;
  periodGrowthRate: number;
  trend: "positive" | "negative" | "neutral";
  currency: string;
}

export interface GrowthRateResult {
  current: {
    total: number;
    period: { from: string; to: string };
    data: GrowthRateDataItem[];
  };
  previous: {
    total: number;
    period: { from: string; to: string };
    data: GrowthRateDataItem[];
  };
}

export interface GrowthRateChartProps {
  summary: GrowthRateSummary;
  result: GrowthRateResult;
  currency?: string;
  height?: number;
  className?: string;
}

/**
 * Growth rate bar chart comparing current vs previous period
 */
export function GrowthRateChart({
  summary,
  result,
  currency,
  height = 280,
  className = "",
}: GrowthRateChartProps) {
  const effectiveCurrency = currency || summary.currency || "USD";

  // Combine current and previous data
  const currentData = result.current.data;
  const previousData = result.previous.data;

  const maxLen = Math.max(currentData.length, previousData.length);
  const chartData = Array.from({ length: maxLen }, (_, i) => ({
    month: formatMonth(currentData[i]?.date || previousData[i]?.date || ""),
    current: currentData[i]?.value || 0,
    previous: previousData[i]?.value || 0,
  }));

  const tickFormatter = (value: number) => formatCompact(value);
  const { marginLeft } = calculateChartMargin(chartData, "current", tickFormatter);

  const isPositive = summary.growthRate >= 0;
  const trendIcon = isPositive ? "↑" : "↓";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => {
            const name = entry.dataKey === "current" ? "Current Period" : "Previous Period";
            return (
              <p key={`${entry.dataKey}-${index}`} className="chart-tooltip-value">
                {name}: {formatCurrency(entry.value, effectiveCurrency)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Growth Header */}
      <div className="flex gap-8 mb-5 pb-4 border-b border-border">
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">Growth Rate</div>
          <div
            className={`text-3xl font-bold ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? "+" : ""}
            {summary.growthRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {trendIcon} {summary.trend} trend
          </div>
        </div>
      </div>

      {/* Period Comparison Cards */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 p-3 border border-border rounded">
          <div className="text-[11px] text-muted-foreground mb-1">Current Period</div>
          <div className="text-lg font-semibold text-foreground">
            {formatCurrency(summary.currentTotal, effectiveCurrency)}
          </div>
        </div>
        <div className="flex-1 p-3 border border-border rounded">
          <div className="text-[11px] text-muted-foreground mb-1">Previous Period</div>
          <div className="text-lg font-semibold text-foreground">
            {formatCurrency(summary.previousTotal, effectiveCurrency)}
          </div>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid-stroke)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={tickFormatter}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />

            <Bar
              dataKey="current"
              fill="var(--chart-bar-fill)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="previous"
              fill="var(--chart-bar-fill-secondary)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend
        items={[
          { label: "Current Period", type: "solid" },
          { label: "Previous Period", type: "pattern" },
        ]}
      />
    </div>
  );
}
