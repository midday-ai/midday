"use client";

import { formatAmount } from "@midday/utils/format";
import { commonChartConfig } from "../chart-utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name?: string }>;
  label?: string;
  currency?: string;
  locale?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency,
  locale,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const fmt = (v: number) => {
    if (!currency) return v.toLocaleString(locale);
    return (
      formatAmount({
        amount: v,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${v.toLocaleString()}`
    );
  };

  return (
    <div
      className="border p-2 text-[10px] bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm"
      style={{ fontFamily: commonChartConfig.fontFamily }}
    >
      <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-black dark:text-white">
          {entry.name || entry.dataKey}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
}
