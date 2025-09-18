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
}

// Custom formatter for cash flow tooltip
const cashFlowTooltipFormatter = (
  value: any,
  name: string,
): [string, string] => {
  const formattedValue = `$${value.toLocaleString()}`;
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
}: CashFlowChartProps) {
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
      <BaseChart data={data} height={height}>
        <StyledXAxis dataKey="month" />
        <StyledYAxis
          tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
        />

        <Tooltip
          content={<StyledTooltip formatter={cashFlowTooltipFormatter} />}
          wrapperStyle={{ zIndex: 9999 }}
        />

        <StyledBar dataKey="inflow" usePattern={false} />
        <StyledBar dataKey="outflow" usePattern />
        <StyledBar dataKey="netFlow" usePattern={false} />

        {showCumulative && (
          <StyledLine dataKey="cumulativeFlow" strokeDasharray="5 5" />
        )}

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
