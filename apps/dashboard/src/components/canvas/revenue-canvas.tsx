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
import { revenueArtifact } from "@api/ai/artifacts/revenue";
import { RevenueTrendChart } from "../charts/revenue-trend-chart";

export function RevenueCanvas() {
  const { data, status } = useArtifact(revenueArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  // Use artifact data or fallback to empty/default values
  const revenueData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      revenue: item.revenue,
      lastYearRevenue: item.lastYearRevenue,
      average: item.average,
    })) || [];

  const revenueMetrics = data?.metrics
    ? [
        {
          id: "total-revenue",
          title: "Total Revenue",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.totalRevenue || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "All periods combined",
        },
        {
          id: "average-monthly-revenue",
          title: "Average Monthly Revenue",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.averageMonthlyRevenue || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Over last 12 months",
        },
        {
          id: "current-month-revenue",
          title: "Current Month Revenue",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.currentMonthRevenue || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Latest month",
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
      <CanvasHeader title="Revenue Analysis" isLoading={isLoading} />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have revenue data */}
          {showChart && (
            <CanvasChart
              title="Monthly Revenue Trend"
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
              <RevenueTrendChart
                data={revenueData}
                height={320}
                showLegend={false}
                currency={data?.currency || "USD"}
                locale={user?.locale ?? undefined}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={revenueMetrics}
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
