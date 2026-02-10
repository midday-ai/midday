"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount } from "@/utils/format";
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";

interface ProjectedCashBalanceData {
  month: number;
  baseCase: number;
  worstCase: number;
  bestCase: number;
}

interface StressTestChartProps {
  projectedCashBalance: ProjectedCashBalanceData[];
  height?: number;
  currency?: string;
  locale?: string;
}

// Custom tooltip for cash balance projection
const ProjectionTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
  locale,
}: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const formatCurrency = (amount: number) =>
      formatAmount({
        amount,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${amount.toLocaleString()}`;

    const baseCase = payload.find((p) => p.dataKey === "baseCase")?.value;
    const worstCase = payload.find((p) => p.dataKey === "worstCase")?.value;
    const bestCase = payload.find((p) => p.dataKey === "bestCase")?.value;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">Month {label}</p>
        {typeof baseCase === "number" && (
          <p className="text-black dark:text-white">
            Base Case: {formatCurrency(baseCase)}
          </p>
        )}
        {typeof worstCase === "number" && (
          <p className="text-black dark:text-white">
            Worst Case: {formatCurrency(worstCase)}
          </p>
        )}
        {typeof bestCase === "number" && (
          <p className="text-black dark:text-white">
            Best Case: {formatCurrency(bestCase)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Cash Balance Projection Line Chart
export function CashBalanceProjectionChart({
  data,
  height = 320,
  currency = "USD",
  locale,
}: {
  data: ProjectedCashBalanceData[];
  height?: number;
  currency?: string;
  locale?: string;
}) {
  const tickFormatter = createCompactTickFormatter();
  // Calculate margin based on the maximum value across all scenarios
  // Create a temporary data structure with max values for margin calculation
  const maxValues = data.map((d) => ({
    maxValue: Math.max(d.baseCase, d.worstCase, d.bestCase),
  }));
  const { marginLeft } = useChartMargin(maxValues, "maxValue", tickFormatter);

  return (
    <div className="w-full" style={{ height }}>
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
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--chart-axis-text)",
              fontSize: 10,
              fontFamily: commonChartConfig.fontFamily,
            }}
            label={{
              value: "Months from now",
              position: "insideBottom",
              offset: -10,
              style: {
                textAnchor: "middle",
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              },
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
          <Tooltip
            content={<ProjectionTooltip currency={currency} locale={locale} />}
            wrapperStyle={{ zIndex: 9999 }}
          />
          {/* Base Case Line (white in dark mode, black in light mode) */}
          <Line
            type="monotone"
            dataKey="baseCase"
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            dot={false}
            name="Base Case"
            isAnimationActive={false}
          />
          {/* Worst Case Line (gray, lighter in dark mode) */}
          <Line
            type="monotone"
            dataKey="worstCase"
            stroke="var(--chart-line-secondary)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Worst Case"
            isAnimationActive={false}
          />
          {/* Best Case Line (gray, lighter in dark mode) */}
          <Line
            type="monotone"
            dataKey="bestCase"
            stroke="var(--chart-line-secondary)"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Best Case"
            isAnimationActive={false}
          />
          {/* Reference line at zero */}
          <ReferenceLine
            y={0}
            stroke="hsl(var(--border))"
            strokeDasharray="2 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Combined Stress Test Chart Component
export function StressTestChart({
  projectedCashBalance,
  height = 320,
  currency = "USD",
  locale,
}: StressTestChartProps) {
  return (
    <CashBalanceProjectionChart
      data={projectedCashBalance}
      height={height}
      currency={currency}
      locale={locale}
    />
  );
}
