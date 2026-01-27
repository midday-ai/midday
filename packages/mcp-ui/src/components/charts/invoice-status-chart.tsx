"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatNumber } from "@/utils/format";
import { getChartColors, isDarkMode } from "@/utils/chart-config";

export interface InvoiceStatusItem {
  status: string;
  count: number;
  amount: number;
}

export interface InvoiceStatusSummary {
  totalCount: number;
  totalAmount: number;
  statuses: InvoiceStatusItem[];
  currency: string;
}

export interface InvoiceStatusChartProps {
  summary: InvoiceStatusSummary;
  currency?: string;
  height?: number;
  className?: string;
}

// Status-specific colors
const statusColors: Record<string, { light: string; dark: string }> = {
  paid: { light: "#22c55e", dark: "#4ade80" },
  unpaid: { light: "#f59e0b", dark: "#fbbf24" },
  overdue: { light: "#ef4444", dark: "#f87171" },
  draft: { light: "#6b7280", dark: "#9ca3af" },
  canceled: { light: "#374151", dark: "#6b7280" },
  scheduled: { light: "#3b82f6", dark: "#60a5fa" },
};

/**
 * Invoice status donut chart showing invoice breakdown by status
 */
export function InvoiceStatusChart({
  summary,
  currency,
  height = 320,
  className = "",
}: InvoiceStatusChartProps) {
  const isDark = isDarkMode();
  const effectiveCurrency = currency || summary.currency || "USD";
  const fallbackColors = getChartColors(isDark);

  // Transform data for chart
  const chartData = summary.statuses
    .filter((s) => s.count > 0)
    .map((item, index) => {
      const statusColorPair = statusColors[item.status.toLowerCase()];
      const color = statusColorPair
        ? isDark
          ? statusColorPair.dark
          : statusColorPair.light
        : fallbackColors[index % fallbackColors.length];

      return {
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        value: item.count,
        amount: item.amount,
        color,
      };
    });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{item.name}</p>
          <p className="chart-tooltip-value">{item.value} invoices</p>
          <p className="text-[10px] text-muted-foreground">
            {formatCurrency(item.amount, effectiveCurrency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Summary Header */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-foreground">
          {formatNumber(summary.totalCount)}
        </div>
        <div className="text-sm text-muted-foreground">Total Invoices</div>
        <div className="text-lg font-medium text-foreground mt-1">
          {formatCurrency(summary.totalAmount, effectiveCurrency)}
        </div>
      </div>

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
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
              paddingAngle={2}
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

      {/* Status Legend */}
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
              <span className="text-foreground">{item.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{item.value} invoices</span>
              <span className="font-medium text-foreground w-24 text-right">
                {formatCurrency(item.amount, effectiveCurrency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
