"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/utils/format";
import { getChartColors, isDarkMode } from "@/utils/chart-config";

export interface SpendingData {
  name: string;
  slug?: string;
  amount: number;
  currency: string;
  color?: string;
  percentage: number;
}

export interface SpendingChartProps {
  data: SpendingData[];
  currency?: string;
  height?: number;
  className?: string;
}

/**
 * Spending breakdown donut chart
 * Shows category-wise spending with percentages
 */
export function SpendingChart({
  data,
  currency,
  height = 320,
  className = "",
}: SpendingChartProps) {
  const isDark = isDarkMode();
  const chartColors = getChartColors(isDark);
  const effectiveCurrency = currency || data[0]?.currency || "USD";

  // Sort and limit to top 7 categories
  const chartData = [...data]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 7)
    .map((item, index) => ({
      ...item,
      value: Math.abs(item.amount),
      color: chartColors[index % chartColors.length],
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{item.name}</p>
          <p className="chart-tooltip-value">
            {formatCurrency(item.value, effectiveCurrency)}
          </p>
          <p className="text-[#707070] dark:text-[#666666] text-[10px]">
            {item.percentage?.toFixed(1) || ((item.value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative" style={{ height }}>
        {/* Dotted background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isDark
              ? "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />
        <ResponsiveContainer width="100%" height="100%" className="relative">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
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
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {chartData.map((item, index) => (
          <div
            key={`legend-${item.name}-${index}`}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground truncate max-w-[150px]">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground">
                {formatCurrency(item.value, effectiveCurrency)}
              </span>
              <span className="text-muted-foreground w-12 text-right">
                {item.percentage?.toFixed(1) || ((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
