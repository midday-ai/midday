"use client";

import { formatAmount } from "@/utils/format";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createCompactTickFormatter, useChartMargin } from "./chart-utils";

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
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">Month {label}</p>
        {payload.map((entry: any) => {
          const value = entry.value as number;
          const name = entry.name as string;
          const color = entry.color as string;

          return (
            <p key={name} className="text-sm" style={{ color }}>
              <span className="font-medium capitalize">{name}:</span>{" "}
              {formatAmount({
                amount: value,
                currency,
                locale,
              })}
            </p>
          );
        })}
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
  const { marginLeft } = useChartMargin(
    data.map((d) => Math.max(d.baseCase, d.worstCase, d.bestCase)),
    "baseCase",
    tickFormatter,
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 0, right: 6, left: -marginLeft, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e6e6e6"
            className="dark:stroke-[#1d1d1d]"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#707070",
              fontSize: 10,
              fontFamily: "Hedvig Letters Sans",
              className: "dark:fill-[#666666]",
            }}
            label={{
              value: "Months from now",
              position: "insideBottom",
              offset: -5,
              style: {
                textAnchor: "middle",
                fill: "#707070",
                fontSize: 10,
                fontFamily: "Hedvig Letters Sans",
              },
              className: "dark:fill-[#666666]",
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#707070",
              fontSize: 10,
              fontFamily: "Hedvig Letters Sans",
              className: "dark:fill-[#666666]",
            }}
            tickFormatter={tickFormatter}
          />
          <Tooltip
            content={<ProjectionTooltip currency={currency} locale={locale} />}
            wrapperStyle={{ zIndex: 9999 }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "12px",
              fontFamily: "Hedvig Letters Sans",
            }}
            iconType="line"
          />
          {/* Base Case Line (white in dark mode, black in light mode) */}
          <Line
            type="monotone"
            dataKey="baseCase"
            stroke="#000000"
            className="dark:stroke-white"
            strokeWidth={2}
            dot={false}
            name="Base Case"
            isAnimationActive={false}
          />
          {/* Worst Case Line (gray with opacity) */}
          <Line
            type="monotone"
            dataKey="worstCase"
            stroke="#666666"
            className="dark:stroke-[#6666664D]"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Worst Case"
            isAnimationActive={false}
          />
          {/* Best Case Line (gray with opacity) */}
          <Line
            type="monotone"
            dataKey="bestCase"
            stroke="#666666"
            className="dark:stroke-[#6666664D]"
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
