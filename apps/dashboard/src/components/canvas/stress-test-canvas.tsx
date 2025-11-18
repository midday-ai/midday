"use client";

import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { StressTestChart } from "@/components/charts/stress-test-chart";
import { useUserQuery } from "@/hooks/use-user";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { cashFlowStressTestArtifact } from "@api/ai/artifacts/cash-flow-stress-test";

export function StressTestCanvas() {
  const { data, status } = useArtifact(cashFlowStressTestArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  const currency = data?.currency || "USD";
  const locale = user?.locale || undefined;

  const projectedCashBalance = data?.chart?.projectedCashBalance || [];
  const metrics = data?.metrics;

  // Prepare metrics cards
  const stressTestMetrics: Array<{
    id: string;
    title: string;
    value: string;
    subtitle: string;
  }> = [];

  if (metrics) {
    stressTestMetrics.push(
      {
        id: "base-case-runway",
        title: "Base Case Runway",
        value:
          metrics.baseCaseRunway >= 999
            ? "∞"
            : `${metrics.baseCaseRunway.toFixed(1)} months`,
        subtitle: "Current trends continue",
      },
      {
        id: "worst-case-runway",
        title: "Worst Case Runway",
        value:
          metrics.worstCaseRunway >= 999
            ? "∞"
            : `${metrics.worstCaseRunway.toFixed(1)} months`,
        subtitle: "Revenue -30%, Expenses +20%",
      },
      {
        id: "best-case-runway",
        title: "Best Case Runway",
        value:
          metrics.bestCaseRunway >= 999
            ? "∞"
            : `${metrics.bestCaseRunway.toFixed(1)} months`,
        subtitle: "Revenue +20%, Expenses -10%",
      },
      {
        id: "stress-test-score",
        title: "Stress Test Score",
        value: `${metrics.stressTestScore}/100`,
        subtitle:
          metrics.stressTestScore >= 80
            ? "Excellent resilience"
            : metrics.stressTestScore >= 60
              ? "Good resilience"
              : metrics.stressTestScore >= 30
                ? "Concerning"
                : "Critical",
      },
    );
  }

  const showChart =
    stage &&
    ["loading", "chart_ready", "metrics_ready", "analysis_ready"].includes(
      stage,
    );

  const showSummarySkeleton = !stage || stage !== "analysis_ready";

  return (
    <BaseCanvas>
      <CanvasHeader title="Cash Flow Stress Test" isLoading={isLoading} />

      <CanvasContent>
        <div className="space-y-8">
          {/* Cash Balance Projection Chart */}
          {showChart && projectedCashBalance.length > 0 && (
            <CanvasChart
              title="Cash Balance Projection"
              isLoading={stage === "loading" || stage === "chart_ready"}
              height="20rem"
            >
              <StressTestChart
                projectedCashBalance={projectedCashBalance}
                height={320}
                currency={currency}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Metrics Grid */}
          <CanvasGrid
            items={stressTestMetrics}
            layout="2/2"
            isLoading={stage === "loading" || stage === "chart_ready"}
          />

          {/* Summary Section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
