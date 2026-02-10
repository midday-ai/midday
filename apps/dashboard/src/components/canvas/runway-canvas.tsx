"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { runwayArtifact } from "@api/ai/artifacts/runway";
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
import { RunwayChart } from "@/components/charts/runway-chart";
import { useUserQuery } from "@/hooks/use-user";

export function RunwayCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(runwayArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const _isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

  const metrics = data?.metrics;
  const statusValue = metrics?.status;

  // Transform chart data for RunwayChart component
  const monthlyData = data?.chart?.monthlyData || [];
  const runwayChartData = monthlyData.map((item) => ({
    month: item.month,
    cashRemaining: item.cashBalance,
    burnRate: item.burnRate,
    runwayMonths: item.runway,
  }));

  const showChart = shouldShowChart(stage);

  // Build metrics array with status indicator
  const runwayMetrics = metrics
    ? [
        {
          id: "current-runway",
          title: "Cash Runway",
          value: `${metrics.currentRunway || 0} months`,
          subtitle:
            statusValue === "healthy"
              ? "Healthy (12+ months)"
              : statusValue === "concerning"
                ? "Concerning (6-11 months)"
                : statusValue === "critical"
                  ? "Critical (<6 months)"
                  : stage === "loading"
                    ? "Loading..."
                    : "No data",
        },
        {
          id: "cash-balance",
          title: "Cash Balance",
          value: formatCurrencyAmount(
            metrics.cashBalance || 0,
            currency,
            locale,
          ),
          subtitle: "Current available cash",
        },
        {
          id: "average-burn-rate",
          title: "Average Burn Rate",
          value: formatCurrencyAmount(
            metrics.averageBurnRate || 0,
            currency,
            locale,
          ),
          subtitle: "Monthly spending average",
        },
        {
          id: "status",
          title: "Status",
          value:
            statusValue === "healthy"
              ? "Healthy"
              : statusValue === "concerning"
                ? "Concerning"
                : statusValue === "critical"
                  ? "Critical"
                  : "Unknown",
          subtitle:
            statusValue === "healthy"
              ? "Sufficient cash reserves"
              : statusValue === "concerning"
                ? "Monitor closely"
                : statusValue === "critical"
                  ? "Take immediate action"
                  : "No status available",
        },
      ]
    : [];

  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Cash Runway" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have runway data */}
          {showChart && runwayChartData.length > 0 && (
            <CanvasChart
              title="Cash Runway Projection"
              isLoading={stage === "loading" || stage === "chart_ready"}
              height="20rem"
              legend={{
                items: [
                  {
                    label: "Runway (months)",
                    type: "solid",
                  },
                ],
              }}
            >
              <RunwayChart
                data={runwayChartData}
                height={320}
                showLegend={false}
                displayMode="months"
                currency={currency}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={runwayMetrics}
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
