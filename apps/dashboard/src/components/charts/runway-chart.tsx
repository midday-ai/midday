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
import { useChartMargin } from "./chart-utils";
import type { BaseChartProps } from "./chart-utils";

interface RunwayData {
  month: string;
  cashRemaining: number;
  burnRate: number;
  projectedCash?: number;
}

interface RunwayChartProps extends BaseChartProps {
  data: RunwayData[];
  showProjection?: boolean;
  showLegend?: boolean;
}

// Custom formatter for runway tooltip
const runwayTooltipFormatter = (value: any, name: string): [string, string] => {
  const formattedValue = `$${value.toLocaleString()}`;
  const displayName =
    name === "cashRemaining"
      ? "Cash Remaining"
      : name === "burnRate"
        ? "Burn Rate"
        : "Projected Cash";
  return [formattedValue, displayName];
};

export function RunwayChart({
  data,
  height = 320,
  className = "",
  showProjection = true,
  showLegend = true,
}: RunwayChartProps) {
  const tickFormatter = (value: number) => `$${(value / 1000).toFixed(0)}k`;
  const maxValues = data.map((d) => ({
    maxValue: Math.max(d.cashRemaining, d.burnRate, d.projectedCash ?? 0),
  }));
  const { marginLeft } = useChartMargin(maxValues, "maxValue", tickFormatter);

  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Cash Runway"
          items={[
            { label: "Cash Remaining", type: "solid" },
            { label: "Burn Rate", type: "pattern" },
            ...(showProjection
              ? [{ label: "Projected", type: "dashed" as const }]
              : []),
          ]}
        />
      )}

      {/* Chart */}
      <BaseChart
        data={data}
        height={height}
        margin={{ top: 5, right: 5, left: -marginLeft, bottom: 5 }}
      >
        <StyledXAxis dataKey="month" />
        <StyledYAxis tickFormatter={tickFormatter} />

        <Tooltip
          content={<StyledTooltip formatter={runwayTooltipFormatter} />}
          wrapperStyle={{ zIndex: 9999 }}
        />

        <StyledArea dataKey="cashRemaining" usePattern={false} useGradient />
        <StyledArea dataKey="burnRate" usePattern useGradient={false} />

        {showProjection && (
          <StyledLine dataKey="projectedCash" strokeDasharray="5 5" />
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
