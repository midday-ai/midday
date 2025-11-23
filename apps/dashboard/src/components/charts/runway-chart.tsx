"use client";

import { formatAmount } from "@/utils/format";
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
import { createYAxisTickFormatter, useChartMargin } from "./chart-utils";
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
  currency?: string;
  locale?: string;
}

// Custom formatter for runway tooltip
const runwayTooltipFormatter = (
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
  currency = "USD",
  locale,
}: RunwayChartProps) {
  const tickFormatter = createYAxisTickFormatter(currency, locale);
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
          content={
            <StyledTooltip
              formatter={(value: any, name: string) =>
                runwayTooltipFormatter(value, name, currency, locale)
              }
            />
          }
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
