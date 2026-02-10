"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { expensesArtifact } from "@api/ai/artifacts/expenses";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import {
  formatCurrencyAmount,
  shouldShowChart,
  shouldShowMetricsSkeleton,
  shouldShowSummarySkeleton,
} from "@/components/canvas/utils";
import { CategoryExpenseDonutChart } from "@/components/charts/category-expense-donut-chart";
import { useUserQuery } from "@/hooks/use-user";

export function CategoryExpensesCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(expensesArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const _isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;
  const categoryData = data?.chart?.categoryData || [];
  const metrics = data?.metrics;

  // Categories are already sorted by amount (largest first) from the database
  // Get the largest expense categories for the chart
  const largestCategories = categoryData.slice(0, 10); // Top 10 categories

  // Gray shades for legend (matching the chart)
  const grayShades = [
    "#ffffff", // White for first
    "#707070", // Gray for second
    "#A0A0A0", // Light gray for third
    "#606060", // Dark gray for fourth
  ];

  // Prepare chart data (colors will be handled by the chart component)
  const chartDataWithColors = largestCategories;

  // Prepare legend items - show top 3 largest categories with gray shades
  const legendItems = chartDataWithColors.slice(0, 3).map((item, index) => ({
    label: item.category,
    type: "solid" as const,
    color: grayShades[index % grayShades.length],
  }));

  // Get top 4 categories for metrics cards
  const topCategories = largestCategories.slice(0, 4);
  const _totalExpenses = metrics?.totalExpenses || 0;
  const categoryCoverage = metrics?.categoryCoverage;
  const optimizationPotential = metrics?.optimizationPotential;

  // Prepare metrics cards dynamically from largest categories
  const expenseMetrics: Array<{
    id: string;
    title: string;
    value: string;
    subtitle: string;
  }> = topCategories.map((category, index) => ({
    id: `category-${index}`,
    title: index === 0 ? "Top Category" : category.category,
    value:
      index === 0
        ? category.category
        : formatCurrencyAmount(category.amount, currency, locale),
    subtitle:
      index === 0
        ? `${formatCurrencyAmount(category.amount, currency, locale)} this month`
        : `${category.percentage.toFixed(1)}% of total`,
  }));

  // If we have fewer than 4 categories, add general metrics
  if (topCategories.length < 4) {
    if (categoryCoverage !== undefined) {
      expenseMetrics.push({
        id: "category-coverage",
        title: "Category Coverage",
        value: `${Math.round(categoryCoverage)}%`,
        subtitle: "Tagged transactions",
      });
    }
    if (
      optimizationPotential !== undefined &&
      optimizationPotential > 0 &&
      expenseMetrics.length < 4
    ) {
      expenseMetrics.push({
        id: "optimization-potential",
        title: "Optimization Potential",
        value: formatCurrencyAmount(optimizationPotential, currency, locale),
        subtitle: "Quick wins this month",
      });
    }
  }

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Analysis" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Chart Section */}
          {showChart && (
            <CanvasChart
              title="Category Expense Breakdown"
              legend={{
                items: legendItems,
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <CategoryExpenseDonutChart
                data={chartDataWithColors}
                currency={currency}
                locale={locale}
                height={320}
              />
            </CanvasChart>
          )}

          {/* Metrics Grid */}
          <CanvasGrid
            items={expenseMetrics}
            layout="2/2"
            isLoading={shouldShowMetricsSkeleton(stage)}
          />

          {/* Summary Section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
