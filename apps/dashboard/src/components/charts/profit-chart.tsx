"use client";

import { ReferenceLine, Tooltip } from "recharts";
import {
  BaseChart,
  ChartLegend,
  StyledBar,
  StyledLine,
  StyledTooltip,
  StyledXAxis,
  StyledYAxis,
} from "./base-charts";
import type { BaseChartProps } from "./chart-utils";

interface ProfitData {
  month: string;
  profit: number;
  expenses: number;
  revenue?: number;
}

interface ProfitChartProps extends BaseChartProps {
  data: ProfitData[];
  showRevenue?: boolean;
  showLegend?: boolean;
}

// Custom formatter for profit tooltip
const profitTooltipFormatter = (value: any, name: string): [string, string] => {
  const formattedValue = `$${value.toLocaleString()}`;
  const displayName =
    name === "profit" ? "Profit" : name === "expenses" ? "Expenses" : "Revenue";
  return [formattedValue, displayName];
};

export function ProfitChart({
  data,
  height = 320,
  className = "",
  showRevenue = true,
  showLegend = true,
}: ProfitChartProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Profit Analysis"
          items={[
            { label: "Profit", type: "solid" },
            { label: "Expenses", type: "solid" },
            ...(showRevenue
              ? [{ label: "Revenue", type: "dashed" as const }]
              : []),
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
          content={<StyledTooltip formatter={profitTooltipFormatter} />}
          wrapperStyle={{ zIndex: 9999 }}
        />

        <StyledBar dataKey="profit" usePattern={false} />
        <StyledBar dataKey="expenses" usePattern />

        {showRevenue && <StyledLine dataKey="revenue" strokeDasharray="5 5" />}

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
