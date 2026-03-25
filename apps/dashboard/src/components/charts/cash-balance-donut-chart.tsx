"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatAmount } from "@/utils/format";

interface AccountData {
  name: string;
  amount: number;
  percentage: number;
}

interface CashBalanceDonutChartProps {
  data: AccountData[];
  currency?: string;
  locale?: string;
  height?: number;
  className?: string;
}

const donutTooltipFormatter = ({
  active,
  payload,
  currency = "USD",
  locale,
}: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="border p-2 text-[10px] bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{data.name}</p>
        <p className="text-black dark:text-white">
          {formatAmount({
            amount: data.amount,
            currency,
            locale,
          })}
        </p>
        <p className="text-[#707070] dark:text-[#666666]">
          {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export const grayShades = [
  "hsl(var(--foreground))",
  "#707070",
  "#A0A0A0",
  "#606060",
  "#404040",
  "#303030",
  "#202020",
];

export function CashBalanceDonutChart({
  data,
  currency = "USD",
  locale,
  height = 320,
  className = "",
}: CashBalanceDonutChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    value: item.amount,
    color: grayShades[index % grayShades.length],
  }));

  return (
    <div className={`w-full ${className}`}>
      <div className="relative" style={{ height }}>
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
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
                  key={`cell-${entry.name}-${index}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              content={(props) =>
                donutTooltipFormatter({ ...props, currency, locale })
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
