"use client";

import { ReferenceLine, Tooltip } from "recharts";
import { formatAmount } from "@/utils/format";
import {
  BaseChart,
  ChartLegend,
  StyledArea,
  StyledLine,
  StyledTooltip,
  StyledXAxis,
  StyledYAxis,
} from "./base-charts";
import type { BaseChartProps } from "./chart-utils";
import { createYAxisTickFormatter, useChartMargin } from "./chart-utils";

interface RevenueData {
  month: string;
  revenue: number;
  target?: number;
}

interface RevenueChartProps extends BaseChartProps {
  data: RevenueData[];
  showTarget?: boolean;
  showLegend?: boolean;
  currency?: string;
  locale?: string;
}

// Custom formatter for revenue tooltip
const revenueTooltipFormatter = (
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
  const displayName = name === "revenue" ? "Revenue" : "Target";
  return [formattedValue, displayName];
};

export function RevenueChart({
  data,
  height = 320,
  className = "",
  showTarget = true,
  showLegend = true,
  currency = "USD",
  locale,
}: RevenueChartProps) {
  const tickFormatter = createYAxisTickFormatter(currency, locale);
  const maxValues = data.map((d) => ({
    maxValue: Math.max(d.revenue, d.target ?? 0),
  }));
  const { marginLeft } = useChartMargin(maxValues, "maxValue", tickFormatter);

  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Revenue"
          items={[
            { label: "Revenue", type: "solid" },
            ...(showTarget
              ? [{ label: "Target", type: "dashed" as const }]
              : []),
          ]}
        />
      )}

      {/* Chart */}
      <BaseChart
        data={data}
        height={height}
        margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
      >
        <StyledXAxis dataKey="month" />
        <StyledYAxis tickFormatter={tickFormatter} />

        <Tooltip
          content={
            <StyledTooltip
              formatter={(value: any, name: string) =>
                revenueTooltipFormatter(value, name, currency, locale)
              }
            />
          }
          wrapperStyle={{ zIndex: 9999 }}
        />

        <StyledArea dataKey="revenue" usePattern={false} useGradient />

        {showTarget && <StyledLine dataKey="target" strokeDasharray="5 5" />}

        {/* Reference line at zero */}
        <ReferenceLine
          y={0}
          stroke="hsl(var(--border))"
          strokeDasharray="2 2"
        />
      </BaseChart>
    </div>
  );
}
