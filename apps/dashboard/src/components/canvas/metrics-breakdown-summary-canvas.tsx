"use client";

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
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { metricsBreakdownSummaryArtifact } from "@api/ai/artifacts/metrics-breakdown";
import { parseAsInteger, useQueryState } from "nuqs";

export function MetricsBreakdownSummaryCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(metricsBreakdownSummaryArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

  const summary = data?.summary;
  const categories = data?.categories || [];

  // Prepare summary metrics
  const summaryMetrics = summary
    ? [
        {
          id: "revenue",
          title: "Revenue",
          value: formatCurrencyAmount(summary.revenue, currency, locale),
          subtitle: "Total income",
        },
        {
          id: "expenses",
          title: "Expenses",
          value: formatCurrencyAmount(summary.expenses, currency, locale),
          subtitle: "Total spending",
        },
        {
          id: "profit",
          title: "Profit",
          value: formatCurrencyAmount(summary.profit, currency, locale),
          subtitle: "Revenue - Expenses",
        },
        {
          id: "transactions",
          title: "Transactions",
          value: summary.transactionCount.toString(),
          subtitle: "Total count",
        },
        {
          id: "invoices",
          title: "Invoices",
          value: summary.invoiceCount.toString(),
          subtitle: "Total count",
        },
      ]
    : [];

  // Prepare category chart data
  const categoryChartData = categories.slice(0, 10).map((cat) => ({
    category: cat.name,
    amount: cat.amount,
    percentage: cat.percentage,
    color: cat.color,
  }));

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Breakdown Summary" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Category Breakdown Chart - moved to top */}
          {showChart && categoryChartData.length > 0 && (
            <CanvasChart
              title="Category Breakdown"
              legend={{
                items: categories.slice(0, 3).map((cat) => ({
                  label: cat.name,
                  type: "solid" as const,
                })),
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <CategoryExpenseDonutChart
                data={categoryChartData}
                currency={currency}
                locale={locale}
                height={320}
              />
            </CanvasChart>
          )}

          {/* Summary Metrics Grid */}
          <CanvasGrid
            items={summaryMetrics}
            layout="2/3"
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
