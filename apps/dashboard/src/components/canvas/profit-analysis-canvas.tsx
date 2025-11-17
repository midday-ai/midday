"use client";

import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { profitArtifact } from "@api/ai/artifacts/profit";
import { ProfitChart } from "../charts";

export function ProfitAnalysisCanvas() {
  const { data, status } = useArtifact(profitArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  // Use artifact data or fallback to empty/default values
  const profitData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      profit: item.profit,
      expenses: 0, // Expenses not in artifact data, could be calculated if needed
      revenue: item.profit + (item.profit - item.lastYearProfit), // Approximate
    })) || [];

  const profitMetrics = data?.metrics
    ? [
        {
          id: "current-profit",
          title: "Current Monthly Profit",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.currentMonthlyProfit || 0,
              locale: user?.locale,
            }) || (data.metrics.currentMonthlyProfit || 0).toLocaleString(),
          subtitle: data.metrics.currentMonthlyProfitChange
            ? `${data.metrics.currentMonthlyProfitChange.percentage > 0 ? "+" : ""}${data.metrics.currentMonthlyProfitChange.percentage}% vs ${data.metrics.currentMonthlyProfitChange.period}`
            : stage === "loading"
              ? "Loading..."
              : "No change data",
        },
        {
          id: "profit-margin",
          title: "Profit Margin",
          value: `${data.metrics.profitMargin || 0}%`,
          subtitle:
            data.metrics.profitMargin >= 25
              ? "Above industry avg (25%)"
              : data.metrics.profitMargin >= 15
                ? "Above average"
                : stage === "loading"
                  ? "Loading..."
                  : "Below average",
        },
        {
          id: "average-profit",
          title: "Average Monthly Profit",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.averageMonthlyProfit || 0,
              locale: user?.locale,
            }) || (data.metrics.averageMonthlyProfit || 0).toLocaleString(),
          subtitle: "Over last 6 months",
        },
        {
          id: "revenue-growth",
          title: "Revenue Growth",
          value: `${data.metrics.revenueGrowth || 0}%`,
          subtitle: "Year-over-year increase",
        },
      ]
    : [];

  const showChart =
    stage &&
    ["loading", "chart_ready", "metrics_ready", "analysis_ready"].includes(
      stage,
    );

  const showSummarySkeleton = !stage || stage !== "analysis_ready";

  // Show empty state if no data and not loading
  if (!isLoading && !stage && !data) {
    return (
      <BaseCanvas>
        <div className="space-y-4">
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Profit Analysis
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monthly profit trends and analysis
                </p>
              </div>
            </div>
          </div>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Profit analysis data will appear here
              </p>
            </div>
          </div>
        </div>
      </BaseCanvas>
    );
  }

  return (
    <BaseCanvas>
      <CanvasHeader title="Monthly Profit Trend" isLoading={isLoading} />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have profit data */}
          {showChart && (
            <CanvasChart
              title="Monthly Profit Trend"
              legend={{
                items: [
                  { label: "This Year", type: "solid" },
                  { label: "Last Year", type: "solid" },
                  { label: "Average", type: "pattern" },
                ],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <ProfitChart
                data={profitData}
                height={320}
                showLegend={false}
                showRevenue={false}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={profitMetrics}
            layout="2/2"
            isLoading={stage === "loading" || stage === "chart_ready"}
          />

          {/* Always show summary section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
