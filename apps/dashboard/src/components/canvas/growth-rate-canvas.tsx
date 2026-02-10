"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { growthRateArtifact } from "@api/ai/artifacts/growth-rate";
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
import { GrowthRateChart } from "../charts/growth-rate-chart";

export function GrowthRateCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(growthRateArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const _isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

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
          value: formatCurrencyAmount(
            data.metrics.currentTotal || 0,
            currency,
            locale,
          ),
          subtitle: `${revenueTypeLabel} ${typeLabel.toLowerCase()}`,
        },
        {
          id: "previous-total",
          title: `Previous ${periodLabel}`,
          value: formatCurrencyAmount(
            data.metrics.previousTotal || 0,
            currency,
            locale,
          ),
          subtitle: "Comparison period",
        },
        {
          id: "change-amount",
          title: "Change Amount",
          value: formatCurrencyAmount(
            Math.abs(data.metrics.changeAmount || 0),
            currency,
            locale,
          ),
          subtitle:
            data.metrics.trend === "positive"
              ? "Increase"
              : data.metrics.trend === "negative"
                ? "Decrease"
                : "No change",
        },
      ]
    : [];

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title={`${revenueTypeLabel} ${typeLabel} Growth Rate`} />

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
                currency={currency}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={growthMetrics}
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
