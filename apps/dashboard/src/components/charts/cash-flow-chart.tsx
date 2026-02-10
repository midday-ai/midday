"use client";

import {
  Bar,
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
import { ChartLegend } from "./base-charts";
import type { BaseChartProps } from "./chart-utils";
import {
  commonChartConfig,
  createYAxisTickFormatter,
  getZeroInclusiveDomain,
  useChartMargin,
} from "./chart-utils";

interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeFlow: number;
}

interface CashFlowChartProps extends BaseChartProps {
  data: CashFlowData[];
  showCumulative?: boolean;
  showLegend?: boolean;
  currency?: string;
  locale?: string;
}

// Custom formatter for cash flow tooltip
const cashFlowTooltipFormatter = (
  value: any,
  name: string,
  currency = "USD",
  locale?: string,
): [string, string] => {
  const formattedValue =
    formatAmount({
      amount: value,
      currency,
      locale: locale ?? undefined,
      maximumFractionDigits: 0,
    }) || `${currency}${value.toLocaleString()}`;
  const displayName =
    name === "inflow"
      ? "Cash Inflow"
      : name === "outflow"
        ? "Cash Outflow"
        : name === "netFlow"
          ? "Net Flow"
          : "Cumulative Flow";
  return [formattedValue, displayName];
};

export function CashFlowChart({
  data,
  height = 320,
  className = "",
  showCumulative = true,
  showLegend = true,
  currency = "USD",
  locale,
}: CashFlowChartProps) {
  const tickFormatter = createYAxisTickFormatter(currency, locale);
  // Calculate margin based on the maximum value across all data points
  const maxValues = data.map((d) => ({
    maxValue: Math.max(
      Math.abs(d.inflow),
      Math.abs(d.outflow),
      Math.abs(d.netFlow),
      Math.abs(d.cumulativeFlow),
    ),
  }));
  const { marginLeft } = useChartMargin(maxValues, "maxValue", tickFormatter);

  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Cash Flow Analysis"
          items={[
            { label: "Inflow", type: "solid" },
            { label: "Outflow", type: "pattern" },
            { label: "Net Flow", type: "solid" },
            ...(showCumulative
              ? [{ label: "Cumulative", type: "dashed" as const }]
              : []),
          ]}
        />
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <pattern
                id="outflowPattern"
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
              domain={getZeroInclusiveDomain()}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2 text-[10px] font-sans border bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1d1d1d] text-black dark:text-white">
                      <p className="mb-1 text-gray-500 dark:text-[#666666]">
                        {label}
                      </p>
                      {payload.map((entry, index) => {
                        const value =
                          typeof entry.value === "number" ? entry.value : 0;
                        const [formattedValue, name] = cashFlowTooltipFormatter(
                          value,
                          entry.dataKey as string,
                          currency,
                          locale,
                        );
                        return (
                          <p
                            key={`${entry.dataKey}-${index}`}
                            className="text-black dark:text-white"
                          >
                            {name}: {formattedValue}
                          </p>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
              wrapperStyle={{ zIndex: 9999 }}
            />

            {/* Income bars */}
            <Bar
              dataKey="inflow"
              fill="var(--chart-bar-fill)"
              isAnimationActive={false}
            />
            {/* Expenses bars with pattern */}
            <Bar
              dataKey="outflow"
              fill="url(#outflowPattern)"
              isAnimationActive={false}
            />
            {/* Net flow bars */}
            <Bar
              dataKey="netFlow"
              fill="var(--chart-actual-line)"
              isAnimationActive={false}
            />

            {showCumulative && (
              <Line
                type="monotone"
                dataKey="cumulativeFlow"
                stroke="var(--chart-line-secondary)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Reference line at zero */}
            <ReferenceLine
              y={0}
              stroke="hsl(var(--border))"
              strokeDasharray="2 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
