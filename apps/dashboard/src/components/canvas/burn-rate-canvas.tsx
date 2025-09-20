"use client";

import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { burnRateArtifact } from "@api/ai/artifacts/burn-rate";
import { BurnRateChart } from "../charts";

export function BurnRateCanvas() {
  const { data, status } = useArtifact(burnRateArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

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
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.currentMonthlyBurn || 0,
              locale: user?.locale,
            }) || (data.metrics.currentMonthlyBurn || 0).toLocaleString(),
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
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.averageBurnRate || 0,
              locale: user?.locale,
            }) || (data.metrics.averageBurnRate || 0).toLocaleString(),
          subtitle: `Over last ${data.chart?.monthlyData?.length || 0} months`,
        },
        {
          id: "highest-category",
          title: data.metrics.topCategory?.name || "Top Category",
          value: `${data.metrics.topCategory?.percentage || 0}%`,
          subtitle: `${
            formatAmount({
              currency: data.currency,
              amount: data.metrics.topCategory?.amount || 0,
              locale: user?.locale,
            }) || (data.metrics.topCategory?.amount || 0).toLocaleString()
          } of monthly burn`,
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
      <CanvasHeader title="Analysis" isLoading={isLoading} />

      <div className="flex-1 overflow-y-auto">
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
                chartReadyToAnimate={true}
                showLegend={false}
                currency={data?.currency || "USD"}
                locale={user?.locale ?? undefined}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={burnRateMetrics}
            layout="2/2"
            isLoading={stage === "loading" || stage === "chart_ready"}
          />

          {/* Always show summary section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>
        </div>
      </div>
    </BaseCanvas>
  );
}
