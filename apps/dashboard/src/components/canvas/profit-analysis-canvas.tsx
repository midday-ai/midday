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
