"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { profitArtifact } from "@api/ai/artifacts/profit";
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
import { useUserQuery } from "@/hooks/use-user";
import { ProfitChart } from "../charts";

export function ProfitCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(profitArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const _isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

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
          value: formatCurrencyAmount(
            currentPeriod?.revenue || metrics.totalRevenue || 0,
            currency,
            locale,
          ),
          subtitle: "Total revenue",
        },
        {
          id: "current-expenses",
          title: "Current Period Expenses",
          value: formatCurrencyAmount(
            currentPeriod?.expenses || metrics.totalExpenses || 0,
            currency,
            locale,
          ),
          subtitle: "Total expenses",
        },
        {
          id: "current-profit",
          title: "Current Period Profit",
          value: formatCurrencyAmount(
            currentPeriod?.profit || metrics.currentMonthlyProfit || 0,
            currency,
            locale,
          ),
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
                value: formatCurrencyAmount(
                  previousPeriod.revenue,
                  currency,
                  locale,
                ),
                subtitle: "For comparison",
              },
              {
                id: "previous-expenses",
                title: "Previous Period Expenses",
                value: formatCurrencyAmount(
                  previousPeriod.expenses,
                  currency,
                  locale,
                ),
                subtitle: "For comparison",
              },
              {
                id: "previous-profit",
                title: "Previous Period Profit",
                value: formatCurrencyAmount(
                  previousPeriod.profit,
                  currency,
                  locale,
                ),
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

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Profit & Loss" />

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
                currency={currency}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={profitMetrics}
            layout="2/2"
            isLoading={shouldShowMetricsSkeleton(stage)}
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
