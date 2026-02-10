"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatAmount } from "@/utils/format";
import {
  BaseChart,
  ChartLegend,
  StyledBar,
  StyledTooltip,
  StyledXAxis,
  StyledYAxis,
} from "./base-charts";
import type { BaseChartProps } from "./chart-utils";
import { createYAxisTickFormatter, useChartMargin } from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

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
  currency?: string;
  locale?: string;
  enableSelection?: boolean;
  onSelectionChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onSelectionComplete?: (
    startDate: string,
    endDate: string,
    chartType: string,
  ) => void;
  onSelectionStateChange?: (isSelecting: boolean) => void;
}

// Custom formatter for expenses tooltip
const expensesTooltipFormatter = (
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
  const displayName = name === "amount" ? "Expenses" : name;
  return [formattedValue, displayName];
};

// Custom pie chart tooltip
const pieTooltipFormatter = (
  { active, payload }: any,
  currency = "USD",
  locale?: string,
) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const formattedValue =
      formatAmount({
        amount: data.value,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) || `${currency}${data.value.toLocaleString()}`;
    return (
      <div className="p-2 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-[#1d1d1d] text-black dark:text-white text-xs">
        <p className="mb-1 text-gray-500 dark:text-[#666666]">
          {data.payload.name}
        </p>
        <p>{formattedValue}</p>
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
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionChange,
  onSelectionComplete,
  onSelectionStateChange,
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
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
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
              <Tooltip
                content={(props) =>
                  pieTooltipFormatter(props, currency, locale)
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const tickFormatter = createYAxisTickFormatter(currency, locale);
  const maxValues = data.map((d) => ({ maxValue: d.amount }));
  const { marginLeft } = useChartMargin(maxValues, "maxValue", tickFormatter);

  const chartContent = (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          title="Monthly Expenses"
          items={[{ label: "Expenses", type: "solid" }]}
        />
      )}

      {/* Bar Chart */}
      <BaseChart
        data={data}
        height={height}
        margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
      >
        <StyledXAxis dataKey="month" />
        <StyledYAxis tickFormatter={tickFormatter} />

        <Tooltip
          content={
            <StyledTooltip
              formatter={(value: any, name: string) =>
                expensesTooltipFormatter(value, name, currency, locale)
              }
            />
          }
          wrapperStyle={{ zIndex: 9999 }}
        />

        <StyledBar dataKey="amount" usePattern />
      </BaseChart>
    </div>
  );

  // Pie charts don't support selection
  if (chartType === "pie") {
    return chartContent;
  }

  return (
    <SelectableChartWrapper
      data={data}
      dateKey="month"
      enableSelection={enableSelection}
      onSelectionChange={onSelectionChange}
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "expenses");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="expenses"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
