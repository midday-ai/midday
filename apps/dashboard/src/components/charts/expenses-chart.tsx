"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  BaseChart,
  ChartLegend,
  StyledBar,
  StyledTooltip,
  StyledXAxis,
  StyledYAxis,
} from "./base-charts";
import type { BaseChartProps } from "./chart-utils";

interface ExpenseData {
  month: string;
  amount: number;
  category: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface ExpensesChartProps extends BaseChartProps {
  data: ExpenseData[];
  categoryData?: CategoryData[];
  chartType?: "bar" | "pie";
  showLegend?: boolean;
}

// Custom formatter for expenses tooltip
const expensesTooltipFormatter = (
  value: any,
  name: string,
): [string, string] => {
  const formattedValue = `$${value.toLocaleString()}`;
  const displayName = name === "amount" ? "Expenses" : name;
  return [formattedValue, displayName];
};

// Custom pie chart tooltip
const pieTooltipFormatter = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="p-2 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-[#1d1d1d] text-black dark:text-white text-xs">
        <p className="mb-1 text-gray-500 dark:text-[#666666]">
          {data.payload.name}
        </p>
        <p>${data.value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function ExpensesChart({
  data,
  categoryData,
  height = 320,
  className = "",
  chartType = "bar",
  showLegend = true,
}: ExpensesChartProps) {
  if (chartType === "pie" && categoryData) {
    return (
      <div className={`w-full ${className}`}>
        {/* Legend */}
        {showLegend && (
          <ChartLegend
            title="Expenses by Category"
            items={categoryData.map((item) => ({
              label: item.name,
              type: "solid" as const,
              color: item.color,
            }))}
          />
        )}

        {/* Pie Chart */}
        <div className="relative" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="hsl(var(--foreground))"
                dataKey="value"
              >
                {categoryData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={pieTooltipFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Monthly Expenses"
          items={[{ label: "Expenses", type: "solid" }]}
        />
      )}

      {/* Bar Chart */}
      <BaseChart data={data} height={height}>
        <StyledXAxis dataKey="month" />
        <StyledYAxis
          tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
        />

        <Tooltip
          content={<StyledTooltip formatter={expensesTooltipFormatter} />}
          wrapperStyle={{ zIndex: 9999 }}
        />

        <StyledBar dataKey="amount" usePattern />
      </BaseChart>
    </div>
  );
}
