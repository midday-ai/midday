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
import { formatCurrency, formatCompact, formatMonth } from "@/utils/format";
import { commonChartConfig, calculateChartMargin } from "@/utils/chart-config";
import { InlineLegend } from "@/components/base";

export interface RevenueResultItem {
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

export interface RevenueSummary {
  currentTotal: number;
  prevTotal: number;
  currency: string;
}

export interface RevenueChartProps {
  data: RevenueResultItem[];
  summary?: RevenueSummary;
  currency?: string;
  height?: number;
  className?: string;
}

/**
 * Revenue line chart with period comparison
 */
export function RevenueChart({
  data,
  summary,
  currency,
  height = 320,
  className = "",
}: RevenueChartProps) {
  const effectiveCurrency = currency || summary?.currency || "USD";

  // Transform data for chart
  const chartData = data.map((item) => ({
    month: formatMonth(item.date),
    revenue: item.current?.value || item.value || 0,
    previous: item.previous?.value || 0,
  }));

  const tickFormatter = (value: number) => formatCompact(value);
  const maxValues = chartData.map((d) => ({
    maxValue: Math.max(d.revenue, d.previous),
  }));
  const { marginLeft } = calculateChartMargin(maxValues, "maxValue", tickFormatter);

  // Calculate change percentage
  let changePercent = 0;
  if (summary && summary.prevTotal !== 0) {
    changePercent =
      ((summary.currentTotal - summary.prevTotal) / Math.abs(summary.prevTotal)) * 100;
  }
  const isPositive = changePercent >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => {
            const name = entry.dataKey === "revenue" ? "Current Period" : "Previous Period";
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
      {/* Summary */}
      {summary && (
        <div className="mb-4">
          <div className="text-[11px] text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(summary.currentTotal, effectiveCurrency)}
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? "↑" : "↓"} {Math.abs(changePercent).toFixed(1)}% vs previous period
          </div>
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-actual-line)" stopOpacity={0.1} />
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
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-actual-line)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={{
                fill: "var(--chart-actual-line)",
                strokeWidth: 0,
                r: 3,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--chart-line-secondary)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />

            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend
        items={[
          { label: "Current Period", type: "solid" },
          { label: "Previous Period", type: "dashed" },
        ]}
      />
    </div>
  );
}
