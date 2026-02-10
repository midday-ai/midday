"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { businessHealthScoreArtifact } from "@api/ai/artifacts/business-health-score";
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
  shouldShowChart,
  shouldShowMetricsSkeleton,
  shouldShowSummarySkeleton,
} from "@/components/canvas/utils";
import { BusinessHealthScoreChart } from "@/components/charts/business-health-score-chart";

export function HealthReportCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(businessHealthScoreArtifact, {
    version,
  });
  const { data, status } = artifact;
  const _isLoading = status === "loading";
  const stage = data?.stage;

  // Use artifact data or fallback to empty/default values
  const healthScoreData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      healthScore: item.healthScore,
    })) || [];

  const healthMetrics = data?.metrics
    ? [
        {
          id: "overall-score",
          title: "Overall Score",
          value: `${Math.round(data.metrics.overallScore)}/100`,
          subtitle: "Composite health score",
        },
        {
          id: "revenue-score",
          title: "Revenue Score",
          value: `${Math.round(data.metrics.revenueScore)}/100`,
          subtitle: "Revenue performance",
        },
        {
          id: "expense-score",
          title: "Expense Score",
          value: `${Math.round(data.metrics.expenseScore)}/100`,
          subtitle: "Expense management",
        },
        {
          id: "cash-flow-score",
          title: "Cash Flow Score",
          value: `${Math.round(data.metrics.cashFlowScore)}/100`,
          subtitle: "Cash flow health",
        },
        {
          id: "profitability-score",
          title: "Profitability Score",
          value: `${Math.round(data.metrics.profitabilityScore)}/100`,
          subtitle: "Profitability metrics",
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
          {/* Show chart as soon as we have health score data */}
          {showChart && (
            <CanvasChart
              title="Business Health Score Trend"
              legend={{
                items: [{ label: "Health Score", type: "solid" }],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <BusinessHealthScoreChart
                data={healthScoreData}
                height={320}
                showLegend={false}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={healthMetrics}
            layout="2/2"
            isLoading={shouldShowMetricsSkeleton(stage)}
          />

          {/* Always show summary section */}
          <CanvasSection title="Summary" isLoading={showSummarySkeleton}>
            {data?.analysis?.summary}
          </CanvasSection>

          {/* Show recommendations if available */}
          {data?.analysis?.recommendations &&
            data.analysis.recommendations.length > 0 && (
              <CanvasSection title="Recommendations" isLoading={false}>
                <ul className="list-disc list-inside space-y-2 text-[12px] leading-[17px] font-sans text-black dark:text-white">
                  {data.analysis.recommendations.map((rec, _index) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </CanvasSection>
            )}
        </div>
      </CanvasContent>
    </BaseCanvas>
  );
}
