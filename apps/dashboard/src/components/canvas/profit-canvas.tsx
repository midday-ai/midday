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

export function ProfitCanvas() {
  const { data, status } = useArtifact(profitArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  // Use artifact data or fallback to empty/default values
  const profitData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      profit: item.profit,
      lastYearProfit: item.lastYearProfit,
      average: item.average,
      revenue: item.revenue,
      expenses: item.expenses,
      lastYearRevenue: item.lastYearRevenue,
      lastYearExpenses: item.lastYearExpenses,
    })) || [];

  const metrics = data?.metrics;
  const currentPeriod = metrics?.currentPeriod;
  const previousPeriod = metrics?.previousPeriod;

  // Build metrics array with period comparison
  const profitMetrics = metrics
    ? [
        // Current Period Metrics
        {
          id: "current-revenue",
          title: "Current Period Revenue",
          value:
            formatAmount({
              currency: data.currency,
              amount: currentPeriod?.revenue || metrics.totalRevenue || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Total revenue",
        },
        {
          id: "current-expenses",
          title: "Current Period Expenses",
          value:
            formatAmount({
              currency: data.currency,
              amount: currentPeriod?.expenses || metrics.totalExpenses || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Total expenses",
        },
        {
          id: "current-profit",
          title: "Current Period Profit",
          value:
            formatAmount({
              currency: data.currency,
              amount:
                currentPeriod?.profit || metrics.currentMonthlyProfit || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: metrics.currentMonthlyProfitChange
            ? `${metrics.currentMonthlyProfitChange.percentage > 0 ? "+" : ""}${metrics.currentMonthlyProfitChange.percentage}% vs ${metrics.currentMonthlyProfitChange.period}`
            : "Net profit",
        },
        {
          id: "profit-margin",
          title: "Profit Margin",
          value: `${metrics.profitMargin || 0}%`,
          subtitle:
            metrics.profitMargin >= 25
              ? "Above industry avg (25%)"
              : metrics.profitMargin >= 15
                ? "Above average"
                : stage === "loading"
                  ? "Loading..."
                  : "Below average",
        },
        // Previous Period Metrics (for comparison)
        ...(previousPeriod
          ? [
              {
                id: "previous-revenue",
                title: "Previous Period Revenue",
                value:
                  formatAmount({
                    currency: data.currency,
                    amount: previousPeriod.revenue,
                    locale: user?.locale,
                  }) || "$0",
                subtitle: "For comparison",
              },
              {
                id: "previous-expenses",
                title: "Previous Period Expenses",
                value:
                  formatAmount({
                    currency: data.currency,
                    amount: previousPeriod.expenses,
                    locale: user?.locale,
                  }) || "$0",
                subtitle: "For comparison",
              },
              {
                id: "previous-profit",
                title: "Previous Period Profit",
                value:
                  formatAmount({
                    currency: data.currency,
                    amount: previousPeriod.profit,
                    locale: user?.locale,
                  }) || "$0",
                subtitle: "For comparison",
              },
            ]
          : []),
        // Additional metrics
        {
          id: "revenue-growth",
          title: "Revenue Growth",
          value: `${metrics.revenueGrowth || 0}%`,
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
      <CanvasHeader title="Profit & Loss" isLoading={isLoading} />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have profit data */}
          {showChart && (
            <CanvasChart
              title="Profit & Loss Trend"
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
                currency={data?.currency || "USD"}
                locale={user?.locale ?? undefined}
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
