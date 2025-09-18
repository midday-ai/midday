"use client";

import { ReferenceLine, Tooltip } from "recharts";
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

interface RevenueData {
  month: string;
  revenue: number;
  target?: number;
}

interface RevenueChartProps extends BaseChartProps {
  data: RevenueData[];
  showTarget?: boolean;
  showLegend?: boolean;
}

// Custom formatter for revenue tooltip
const revenueTooltipFormatter = (
  value: any,
  name: string,
): [string, string] => {
  const formattedValue = `$${value.toLocaleString()}`;
  const displayName = name === "revenue" ? "Revenue" : "Target";
  return [formattedValue, displayName];
};

export function RevenueChart({
  data,
  height = 320,
  className = "",
  showTarget = true,
  showLegend = true,
}: RevenueChartProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Monthly Revenue"
          items={[
            { label: "Revenue", type: "solid" },
            ...(showTarget ? [{ label: "Target", type: "dashed" }] : []),
          ]}
        />
      )}

      {/* Chart */}
      <BaseChart data={data} height={height}>
        <StyledXAxis dataKey="month" />
        <StyledYAxis
          tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
        />

        <Tooltip
          content={<StyledTooltip formatter={revenueTooltipFormatter} />}
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
