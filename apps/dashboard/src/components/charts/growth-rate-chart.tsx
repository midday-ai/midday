"use client";

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
import { formatAmount } from "@/utils/format";
import {
  commonChartConfig,
  createCompactTickFormatter,
  getZeroInclusiveDomain,
  useChartMargin,
} from "./chart-utils";

interface GrowthRateData {
  period: string;
  currentTotal: number;
  previousTotal: number;
  growthRate: number;
}

interface GrowthRateChartProps {
  data: GrowthRateData[];
  height?: number;
  currency?: string;
  locale?: string;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
  locale,
}: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const current = payload.find((p) => p.dataKey === "currentTotal")?.value;
    const previous = payload.find((p) => p.dataKey === "previousTotal")?.value;
    const growthRate = payload.find((p) => p.dataKey === "growthRate")?.value;

    // Format amounts using proper currency formatting
    const formatCurrency = (amount: number) =>
      formatAmount({
        amount,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${amount.toLocaleString()}`;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof current === "number" && (
          <p className="text-black dark:text-white">
            Current: {formatCurrency(current)}
          </p>
        )}
        {typeof previous === "number" && (
          <p className="text-black dark:text-white">
            Previous: {formatCurrency(previous)}
          </p>
        )}
        {typeof growthRate === "number" && (
          <p
            className={`text-black dark:text-white ${
              growthRate >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            Growth Rate: {growthRate > 0 ? "+" : ""}
            {growthRate.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function GrowthRateChart({
  data,
  height = 320,
  currency = "USD",
  locale,
}: GrowthRateChartProps) {
  // Use the compact tick formatter
  const tickFormatter = createCompactTickFormatter();

  // Calculate margin using the utility hook
  const { marginLeft } = useChartMargin(data, "currentTotal", tickFormatter);

  return (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid-stroke)"
            />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={tickFormatter}
              dataKey="currentTotal"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={(value) =>
                `${value > 0 ? "+" : ""}${value.toFixed(0)}%`
              }
              domain={getZeroInclusiveDomain()}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            {/* Previous period bars (with opacity) */}
            <Bar
              yAxisId="left"
              dataKey="previousTotal"
              fill="var(--chart-bar-fill-secondary)"
              isAnimationActive={false}
            />
            {/* Current period bars */}
            <Bar
              yAxisId="left"
              dataKey="currentTotal"
              fill="var(--chart-bar-fill)"
              isAnimationActive={false}
            />
            {/* Growth rate line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="growthRate"
              stroke="var(--chart-line-secondary)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-line-secondary)", r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
