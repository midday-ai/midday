"use client";

import { formatCategoryName } from "@/utils/utils";
import { AnalyticsChart } from "@midday/ui/charts/base/analytics-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import {
  CategoryMonthlyExpenditure,
  IncomeMetrics,
  MonthlyExpenditure,
} from "@solomon-ai/client-typescript-sdk";
import { useMemo, useState } from "react";

/**
 * Props for the IncomeMetricsView component.
 * @interface IncomeMetricsViewProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
interface IncomeMetricsViewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional CSS class name */
  className?: string;
  /** User ID for the current user */
  userId: string;
  /** Currency code (e.g., 'USD', 'EUR') */
  currency: string;
  /** Array of income metrics data */
  incomeMetrics?: Array<IncomeMetrics>;
  /** Array of monthly income metrics data */
  monthlyIncomeMetrics?: Array<MonthlyExpenditure>;
  /** Array of income metrics categorized by category */
  incomeMetricsCategories?: Array<CategoryMonthlyExpenditure>;
}

/**
 * IncomeMetricsView component displays various income-related metrics and charts.
 *
 * @component
 * @param {IncomeMetricsViewProps} props - The component props
 * @returns {React.ReactElement} The rendered IncomeMetricsView component
 */
const IncomeMetricsView: React.FC<IncomeMetricsViewProps> = ({
  className,
  userId,
  currency,
  incomeMetrics,
  monthlyIncomeMetrics,
  incomeMetricsCategories,
}) => {
  // format all data into positive values (only use abs)
  if (incomeMetrics) {
    incomeMetrics.forEach((item) => {
      item.totalIncome = Math.abs(item.totalIncome || 0);
    });
  }

  if (monthlyIncomeMetrics) {
    monthlyIncomeMetrics.forEach((item) => {
      item.totalSpending = Math.abs(item.totalSpending || 0);
    });
  }

  if (incomeMetricsCategories) {
    incomeMetricsCategories.forEach((item) => {
      item.totalSpending = Math.abs(item.totalSpending || 0);
    });
  }

  return (
    <div className="space-y-6">
      {/* Render your metrics here using the data */}
      <IncomeMetricsOverTime
        incomeMetrics={incomeMetrics}
        currency={currency}
      />
    </div>
  );
};

/**
 * Props for the IncomeMetricsOverTime component.
 * @interface IncomeMetricsOverTimeProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
interface IncomeMetricsOverTimeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional CSS class name */
  className?: string;
  /** Array of income metrics data */
  incomeMetrics?: Array<IncomeMetrics>;
  /** Currency code (e.g., 'USD', 'EUR') */
  currency: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * IncomeMetricsOverTime component displays charts for income over time and income growth rate.
 *
 * @component
 * @param {IncomeMetricsOverTimeProps} props - The component props
 * @returns {React.ReactElement} The rendered IncomeMetricsOverTime component
 */
const IncomeMetricsOverTime: React.FC<IncomeMetricsOverTimeProps> = ({
  className,
  incomeMetrics,
  currency,
  disabled = false,
}) => {
  /** The currently selected income category */
  const [selectedCategory, setSelectedCategory] = useState("All");

  /**
   * Memoized array of unique income categories.
   * @type {string[]}
   */
  const categories = useMemo(() => {
    if (!incomeMetrics) return ["All"];
    return [
      "All",
      ...new Set(
        incomeMetrics
          .map((metric) => metric.personalFinanceCategoryPrimary)
          .filter(Boolean),
      ),
    ];
  }, [incomeMetrics]);

  /** Keys for the income chart data */
  const dataKeys = ["income"];

  /**
   * Filtered income metrics based on the selected category.
   * @type {IncomeMetrics[]}
   */
  const filteredIncomeMetrics = useMemo(() => {
    if (!incomeMetrics) return [];
    if (selectedCategory === "All") return incomeMetrics;
    return incomeMetrics.filter(
      (metric) => metric.personalFinanceCategoryPrimary === selectedCategory,
    );
  }, [incomeMetrics, selectedCategory]);

  // now we check if the filtered income metrics data and if not we return a div stating no data exists for this
  if (!filteredIncomeMetrics || filteredIncomeMetrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No data available for this category</p>
      </div>
    );
  }

  /**
   * Processed chart data for income over time.
   * @type {Array<{date: string, income: number}>}
   */
  const chartData = filteredIncomeMetrics.map((item) => {
    const year = parseInt(item.month?.toString().slice(0, 4) || "");
    const month = parseInt(item.month?.toString().slice(4, 6) || "") - 1; // JavaScript months are 0-indexed
    const date = new Date(year, month);
    return {
      date: date.toISOString().slice(0, 7), // Format as "YYYY-MM"
      income: item.totalIncome || 0,
    };
  });

  /**
   * Processed chart data for income growth rate.
   * @type {Array<{date: string, growthRate: number}>}
   */
  const expansiveChartData = filteredIncomeMetrics
    .map((item) => ({
      date: new Date(
        parseInt(item.month?.toString().slice(0, 4) || ""),
        parseInt(item.month?.toString().slice(4, 6) || "") - 1,
      ),
      totalIncome: item.totalIncome || 0,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item, index, array) => ({
      date: item.date.toISOString().slice(0, 7), // Format as "YYYY-MM"
      growthRate:
        index > 0
          ? ((item.totalIncome - (array[index - 1]?.totalIncome || 0)) /
              (array[index - 1]?.totalIncome || 1)) *
            100
          : 0,
    }));

  /** Keys for the expansive chart data */
  const expansiveChartDataKeys = Object.keys(
    expansiveChartData[0] || {},
  ).filter((key) => key !== "date");

  return (
    <div className="space-y-6 flex flex-col gap-2">
      <Select onValueChange={setSelectedCategory} value={selectedCategory}>
        <SelectTrigger className="w-[180px] mb-4 rounded-2xl">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="bg-background text-foreground">
          {categories.map((category) => (
            <SelectItem key={category} value={category as string}>
              {formatCategoryName(category as string)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col w-full space-y-16">
        <div className="md:min-h-[650px] w-full">
          <AnalyticsChart
            chartData={chartData}
            title={`Income Over Time - ${formatCategoryName(selectedCategory)}`}
            description={`Net income over time in ${currency} for ${formatCategoryName(selectedCategory)}`}
            dataKeys={dataKeys as any}
            colors={["#333"]}
            trendKey="income"
            chartType="area"
            currency={currency}
            height={400}
            enableAssistantMode={false}
            disabled={disabled}
          />
        </div>

        <div className="md:min-h-[650px] w-full">
          <AnalyticsChart
            chartData={expansiveChartData}
            title={`Income Growth Rate - ${formatCategoryName(selectedCategory)}`}
            description={`Month-over-month income growth rate for ${formatCategoryName(selectedCategory)}`}
            dataKeys={expansiveChartDataKeys as any}
            colors={["#333"]}
            trendKey="growthRate"
            chartType="line"
            currency={currency}
            height={400}
            enableAssistantMode={false}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export { IncomeMetricsView };
