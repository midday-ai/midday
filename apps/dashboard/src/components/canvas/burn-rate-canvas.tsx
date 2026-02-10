"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { burnRateArtifact } from "@api/ai/artifacts/burn-rate";
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
import { BurnRateChart } from "../charts";

export function BurnRateCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(burnRateArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const _isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

  // Use artifact data or fallback to empty/default values
  const burnRateData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      amount: item.currentBurn,
      average: item.averageBurn,
      currentBurn: item.currentBurn,
      averageBurn: item.averageBurn,
    })) || [];

  const burnRateMetrics = data?.metrics
    ? [
        {
          id: "current-burn",
          title: "Current Monthly Burn",
          value: formatCurrencyAmount(
            data.metrics.currentMonthlyBurn || 0,
            currency,
            locale,
          ),
          subtitle: data.analysis?.burnRateChange
            ? `${data.analysis.burnRateChange.percentage}% vs ${data.analysis.burnRateChange.period}`
            : stage === "loading"
              ? "Loading..."
              : "No change data",
        },
        {
          id: "runway-remaining",
          title: "Runway Remaining",
          value: `${data.metrics.runway || 0} months`,
          subtitle:
            data.metrics.runwayStatus ||
            (stage === "loading" ? "Loading..." : "No data"),
        },
        {
          id: "average-burn",
          title: "Average Burn Rate",
          value: formatCurrencyAmount(
            data.metrics.averageBurnRate || 0,
            currency,
            locale,
          ),
          subtitle: `Over last ${data.chart?.monthlyData?.length || 0} months`,
        },
        {
          id: "highest-category",
          title: data.metrics.topCategory?.name || "Top Category",
          value: `${data.metrics.topCategory?.percentage || 0}%`,
          subtitle: `${formatCurrencyAmount(
            data.metrics.topCategory?.amount || 0,
            currency,
            locale,
          )} of monthly burn`,
        },
      ]
    : [];

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Analysis" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have burn rate data */}
          {showChart && (
            <CanvasChart
              title="Monthly Burn Rate"
              legend={{
                items: [
                  { label: "Current", type: "solid" },
                  { label: "Average", type: "pattern" },
                ],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <BurnRateChart
                data={burnRateData}
                height={320}
                showLegend={false}
                currency={currency}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={burnRateMetrics}
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
