"use client";

import { formatCurrency } from "@/utils/format";
import type { TooltipProps } from "recharts";

export interface ChartTooltipProps extends TooltipProps<number, string> {
  currency?: string;
  formatter?: (value: number, name: string) => [string, string];
}

/**
 * Styled chart tooltip matching dashboard design
 */
export function ChartTooltip({
  active,
  payload,
  label,
  currency = "USD",
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry, index) => {
        const value = typeof entry.value === "number" ? entry.value : 0;
        const [formattedValue, name] = formatter
          ? formatter(value, entry.dataKey as string)
          : [formatCurrency(value, currency), entry.dataKey as string];

        return (
          <p key={`${entry.dataKey}-${index}`} className="chart-tooltip-value">
            {name}: {formattedValue}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Simple tooltip for single value charts
 */
export function SimpleTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry, index) => {
        const value = valueFormatter
          ? valueFormatter(entry.value)
          : entry.value.toLocaleString();
        return (
          <p key={index.toString()} className="chart-tooltip-value">
            {entry.name}: {value}
          </p>
        );
      })}
    </div>
  );
}
