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
import { growthRateArtifact } from "@api/ai/artifacts/growth-rate";
import { GrowthRateChart } from "../charts/growth-rate-chart";

export function GrowthRateCanvas() {
  const { data, status } = useArtifact(growthRateArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  // Use artifact data or fallback to empty/default values
  const chartData =
    data?.chart?.periodData?.map((item) => ({
      period: item.period,
      currentTotal: item.currentTotal,
      previousTotal: item.previousTotal,
      growthRate: item.growthRate,
    })) || [];

  const typeLabel = data?.type === "profit" ? "Profit" : "Revenue";
  const revenueTypeLabel = data?.revenueType === "gross" ? "Gross" : "Net";
  const periodLabel =
    data?.period === "monthly"
      ? "Month"
      : data?.period === "quarterly"
        ? "Quarter"
        : "Year";

  const growthMetrics = data?.metrics
    ? [
        {
          id: "growth-rate",
          title: "Growth Rate",
          value: `${data.metrics.currentGrowthRate > 0 ? "+" : ""}${data.metrics.currentGrowthRate.toFixed(1)}%`,
          subtitle: "Period-over-period change",
        },
        {
          id: "current-total",
          title: `Current ${periodLabel}`,
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.currentTotal || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: `${revenueTypeLabel} ${typeLabel.toLowerCase()}`,
        },
        {
          id: "previous-total",
          title: `Previous ${periodLabel}`,
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.previousTotal || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Comparison period",
        },
        {
          id: "change-amount",
          title: "Change Amount",
          value:
            formatAmount({
              currency: data.currency,
              amount: Math.abs(data.metrics.changeAmount || 0),
              locale: user?.locale,
            }) || "$0",
          subtitle:
            data.metrics.trend === "positive"
              ? "Increase"
              : data.metrics.trend === "negative"
                ? "Decrease"
                : "No change",
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
      <CanvasHeader
        title={`${revenueTypeLabel} ${typeLabel} Growth Rate`}
        isLoading={isLoading}
      />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have data */}
          {showChart && (
            <CanvasChart
              title={`${periodLabel}-over-${periodLabel}`}
              legend={{
                items: [
                  { label: "Current", type: "solid" },
                  { label: "Previous", type: "solid" },
                  { label: "Growth Rate %", type: "line" },
                ],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <GrowthRateChart
                data={chartData}
                height={320}
                currency={data?.currency || "USD"}
                locale={user?.locale ?? undefined}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={growthMetrics}
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
