"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPercentage, formatMonth } from "@/utils/format";
import { commonChartConfig } from "@/utils/chart-config";
import { InlineLegend } from "@/components/base";

export interface ProfitMarginDataItem {
  date: string;
  profitMargin: number;
  revenue: number;
  profit: number;
}

export interface ProfitMarginSummary {
  averageMargin: number;
  trend: "up" | "down" | "stable";
  highestMargin: { date: string; value: number };
  lowestMargin: { date: string; value: number };
}

export interface ProfitMarginChartProps {
  data: ProfitMarginDataItem[];
  summary?: ProfitMarginSummary;
  height?: number;
  className?: string;
}

/**
 * Profit margin line chart showing margin trends over time
 */
export function ProfitMarginChart({
  data,
  summary,
  height = 320,
  className = "",
}: ProfitMarginChartProps) {
  // Transform data
  const chartData = data.map((item) => ({
    month: formatMonth(item.date),
    margin: item.profitMargin,
    average: summary?.averageMargin || 0,
  }));

  const tickFormatter = (value: number) => `${value.toFixed(0)}%`;

  // Determine overall health
  const avgMargin = summary?.averageMargin || 0;
  const isHealthy = avgMargin > 10;
  const isWarning = avgMargin > 0 && avgMargin <= 10;

  const getTrendIcon = (trend: string | undefined) => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const margin = payload.find((p: any) => p.dataKey === "margin")?.value;

      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {typeof margin === "number" && (
            <p className="chart-tooltip-value">
              Profit Margin: {formatPercentage(margin)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Summary */}
      {summary && (
        <div className="mb-4">
          <div className="flex items-baseline gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">
                Average Profit Margin
              </div>
              <div
                className={`text-3xl font-bold ${
                  isHealthy
                    ? "text-green-500"
                    : isWarning
                      ? "text-amber-500"
                      : "text-red-500"
                }`}
              >
                {formatPercentage(summary.averageMargin)}
              </div>
              <div
                className={`text-xs flex items-center gap-1 ${
                  summary.trend === "up"
                    ? "text-green-500"
                    : summary.trend === "down"
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {getTrendIcon(summary.trend)} {summary.trend} trend
              </div>
            </div>
          </div>

          {/* High/Low cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 border border-border rounded">
              <div className="text-[10px] text-muted-foreground">Highest</div>
              <div className="text-base font-medium text-green-500">
                {formatPercentage(summary.highestMargin.value)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {formatMonth(summary.highestMargin.date)}
              </div>
            </div>
            <div className="p-3 border border-border rounded">
              <div className="text-[10px] text-muted-foreground">Lowest</div>
              <div className="text-base font-medium text-red-500">
                {formatPercentage(summary.lowestMargin.value)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {formatMonth(summary.lowestMargin.date)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 6, left: 0, bottom: 6 }}
          >
            <defs>
              <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-actual-line)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--chart-actual-line)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />

            <Area
              type="monotone"
              dataKey="margin"
              stroke="var(--chart-actual-line)"
              strokeWidth={2}
              fill="url(#marginGradient)"
              dot={{
                fill: "var(--chart-actual-line)",
                strokeWidth: 0,
                r: 3,
              }}
              isAnimationActive={false}
            />

            {/* Average reference line */}
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--chart-line-secondary)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />

            {/* Zero reference line */}
            <ReferenceLine
              y={0}
              stroke="var(--chart-reference-line-stroke)"
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend
        items={[
          { label: "Profit Margin", type: "solid" },
          { label: "Average", type: "dashed" },
        ]}
      />
    </div>
  );
}
