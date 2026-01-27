"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCompact, formatMonthYear } from "@/utils/format";
import { commonChartConfig, calculateChartMargin, isDarkMode } from "@/utils/chart-config";
import { InlineLegend } from "@/components/base";

export interface BurnRateData {
  date: string;
  value: number;
  currency: string;
}

export interface BurnRateChartProps {
  data: BurnRateData[];
  currency?: string;
  height?: number;
  className?: string;
}

/**
 * Burn rate area chart with average trend line
 */
export function BurnRateChart({
  data,
  currency,
  height = 320,
  className = "",
}: BurnRateChartProps) {
  const isDark = isDarkMode();
  const effectiveCurrency = currency || data[0]?.currency || "USD";

  // Calculate average
  const values = data.map((d) => d.value);
  const average = values.length > 0
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : 0;

  // Transform data with average
  const chartData = data.map((item) => ({
    month: formatMonthYear(item.date),
    amount: item.value,
    average,
  }));

  const tickFormatter = (value: number) => formatCompact(value);
  const { marginLeft } = calculateChartMargin(chartData, "amount", tickFormatter);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const current = payload.find((p: any) => p.dataKey === "amount")?.value;
      const avg = payload.find((p: any) => p.dataKey === "average")?.value;

      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {typeof current === "number" && (
            <p className="chart-tooltip-value">
              Current: {formatCurrency(current, effectiveCurrency)}
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
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <pattern
                id="burnRatePattern"
                x="0"
                y="0"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <rect width="8" height="8" fill="var(--chart-pattern-bg)" />
                <path
                  d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                  stroke="var(--chart-pattern-stroke)"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              </pattern>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--chart-gradient-start)" />
                <stop offset="100%" stopColor="var(--chart-gradient-end)" />
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
              dataKey="amount"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              fill="url(#burnRatePattern)"
              dot={{
                fill: "var(--chart-actual-line)",
                strokeWidth: 0,
                r: 3,
              }}
              activeDot={{
                r: 5,
                fill: "var(--chart-actual-line)",
                stroke: "var(--chart-actual-line)",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--chart-axis-text)"
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
          { label: "Monthly Burn", type: "solid" },
          { label: "Average", type: "dashed" },
        ]}
      />
    </div>
  );
}
