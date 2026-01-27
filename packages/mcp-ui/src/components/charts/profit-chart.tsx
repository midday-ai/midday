"use client";

import { InlineLegend } from "@/components/base";
import {
  calculateChartMargin,
  commonChartConfig,
  getZeroInclusiveDomain,
} from "@/utils/chart-config";
import { formatCompact, formatCurrency, formatMonth } from "@/utils/format";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ProfitResultItem {
  date: string;
  percentage?: {
    value: number;
    status: string;
  };
  current?: {
    value: number;
    currency: string;
  };
  previous?: {
    value: number;
    currency: string;
  };
  value?: number;
}

export interface ProfitSummary {
  currentTotal: number;
  prevTotal: number;
  currency: string;
}

export interface ProfitChartProps {
  data: ProfitResultItem[];
  summary?: ProfitSummary;
  currency?: string;
  height?: number;
  className?: string;
}

/**
 * Profit bar chart with period comparison and trend line
 */
export function ProfitChart({
  data,
  summary,
  currency,
  height = 320,
  className = "",
}: ProfitChartProps) {
  const effectiveCurrency = currency || summary?.currency || "USD";

  // Transform data and calculate average
  const values = data.map((item) => item.current?.value || item.value || 0);
  const average =
    values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 0;

  const chartData = data.map((item) => ({
    month: formatMonth(item.date),
    profit: item.current?.value || item.value || 0,
    lastYearProfit: item.previous?.value || 0,
    average,
  }));

  const tickFormatter = (value: number) => formatCompact(value);
  const { marginLeft } = calculateChartMargin(
    chartData,
    "profit",
    tickFormatter,
  );

  // Calculate change percentage
  let changePercent = 0;
  if (summary && summary.prevTotal !== 0) {
    changePercent =
      ((summary.currentTotal - summary.prevTotal) /
        Math.abs(summary.prevTotal)) *
      100;
  }
  const isProfitPositive = (summary?.currentTotal || 0) >= 0;
  const isChangePositive = changePercent >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const thisYear = payload.find((p: any) => p.dataKey === "profit")?.value;
      const lastYear = payload.find(
        (p: any) => p.dataKey === "lastYearProfit",
      )?.value;
      const avg = payload.find((p: any) => p.dataKey === "average")?.value;

      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {typeof thisYear === "number" && (
            <p className="chart-tooltip-value">
              This Year: {formatCurrency(thisYear, effectiveCurrency)}
            </p>
          )}
          {typeof lastYear === "number" && (
            <p className="chart-tooltip-value">
              Last Year: {formatCurrency(lastYear, effectiveCurrency)}
            </p>
          )}
          {typeof avg === "number" && (
            <p className="chart-tooltip-value">
              Average: {formatCurrency(avg, effectiveCurrency)}
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
          <div className="text-[11px] text-muted-foreground mb-1">
            Total Profit
          </div>
          <div
            className={`text-2xl font-bold ${
              isProfitPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {formatCurrency(summary.currentTotal, effectiveCurrency)}
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${
              isChangePositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isChangePositive ? "↑" : "↓"} {Math.abs(changePercent).toFixed(1)}%
            vs previous period
          </div>
        </div>
      )}

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
              domain={getZeroInclusiveDomain()}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
            />

            {/* Last Year bars */}
            <Bar
              dataKey="lastYearProfit"
              fill="var(--chart-bar-fill-secondary)"
              isAnimationActive={false}
            />
            {/* This Year bars */}
            <Bar
              dataKey="profit"
              fill="var(--chart-bar-fill)"
              isAnimationActive={false}
            />
            {/* Average line */}
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--chart-line-secondary)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend
        items={[
          { label: "This Year", type: "solid" },
          { label: "Last Year", type: "pattern" },
          { label: "Average", type: "dashed" },
        ]}
      />
    </div>
  );
}
