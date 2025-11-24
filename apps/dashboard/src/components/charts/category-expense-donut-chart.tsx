"use client";

import { formatAmount } from "@/utils/format";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

interface CategoryExpenseDonutChartProps {
  data: CategoryData[];
  currency?: string;
  locale?: string;
  height?: number;
  className?: string;
}

// Custom donut chart tooltip
const donutTooltipFormatter = ({
  active,
  payload,
  currency = "USD",
  locale,
}: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white dark:bg-[#0c0c0c] text-black dark:text-white text-xs rounded-none">
        <p className="mb-1 text-gray-500 dark:text-[#666666] font-medium">
          {data.category}
        </p>
        <p className="mb-1 text-black dark:text-white font-sans">
          Amount:{" "}
          {formatAmount({
            amount: data.amount,
            currency,
            locale,
          })}
        </p>
        <p className="text-gray-500 dark:text-[#666666]">
          Share: {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

// Gray shades for categories (always use these, ignore color from data)
export const grayShades = [
  "hsl(var(--foreground))", // Foreground color - adapts to light/dark mode
  "#707070", // Gray for second
  "#A0A0A0", // Light gray for third
  "#606060", // Dark gray for fourth
  "#404040", // Darker gray for fifth
  "#303030", // Even darker gray for sixth
  "#202020", // Very dark gray for seventh
];

export function CategoryExpenseDonutChart({
  data,
  currency = "USD",
  locale,
  height = 320,
  className = "",
}: CategoryExpenseDonutChartProps) {
  // Transform data for the chart - always use gray shades, ignore color from data
  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    category: item.category,
    amount: item.amount,
    color: grayShades[index % grayShades.length],
  }));

  return (
    <div className={`w-full ${className}`}>
      <div className="relative" style={{ height }}>
        {/* Dotted background */}
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
          className="relative z-10"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80} // Inner radius creates the donut hole
              outerRadius={120}
              fill="hsl(var(--foreground))"
              dataKey="value"
              paddingAngle={1}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.category}-${index}`}
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
