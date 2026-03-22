"use client";

import { formatAmount } from "@midday/utils/format";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DonutDataItem {
  name: string;
  value: number;
  percentage?: number;
}

interface DonutChartProps {
  data: DonutDataItem[];
  height?: number;
  currency?: string;
  locale?: string;
}

const GRAY_SHADES = [
  "hsl(var(--foreground))",
  "#707070",
  "#A0A0A0",
  "#606060",
  "#404040",
  "#303030",
  "#202020",
];

function DonutTooltip({
  active,
  payload,
  currency,
  locale,
}: {
  active?: boolean;
  payload?: any[];
  currency?: string;
  locale?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border p-2 text-[10px] bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
      <p className="mb-1 text-[#707070] dark:text-[#666666]">{d.name}</p>
      <p className="text-black dark:text-white">
        {currency
          ? (formatAmount({ amount: d.value, currency, locale }) ?? d.value)
          : d.value.toLocaleString(locale)}
      </p>
      {d.percentage != null && (
        <p className="text-[#707070] dark:text-[#666666]">
          {d.percentage.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export function GenericDonutChart({
  data,
  height = 320,
  currency,
  locale,
}: DonutChartProps) {
  const chartData = data.map((item, i) => ({
    ...item,
    color: GRAY_SHADES[i % GRAY_SHADES.length],
  }));

  return (
    <div className="relative" style={{ height }}>
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <ResponsiveContainer
        width="100%"
        height="100%"
        debounce={1}
        className="relative"
      >
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="hsl(var(--foreground))"
            dataKey="value"
            paddingAngle={1}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}-${index.toString()}`}
                fill={entry.color}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            content={(props: any) => (
              <DonutTooltip {...props} currency={currency} locale={locale} />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
