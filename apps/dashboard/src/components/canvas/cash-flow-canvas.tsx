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
import { cashFlowArtifact } from "@api/ai/artifacts/cash-flow";
import { CashFlowChart } from "../charts";

export function CashFlowCanvas() {
  const { data, status } = useArtifact(cashFlowArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  // Calculate cumulative flow and map artifact data to chart format
  let cumulativeFlow = 0;
  const cashFlowData =
    data?.chart?.monthlyData?.map((item) => {
      cumulativeFlow += item.netCashFlow;
      return {
        month: item.month,
        inflow: item.income,
        outflow: item.expenses,
        netFlow: item.netCashFlow,
        cumulativeFlow,
      };
    }) || [];

  const lastMonthData =
    cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1] : null;

  const cashFlowMetrics = data?.metrics
    ? [
        {
          id: "current-cash-flow",
          title: "Current Monthly Cash Flow",
          value:
            formatAmount({
              currency: data.currency,
              amount: Math.abs(lastMonthData?.netFlow ?? 0) || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: lastMonthData
            ? lastMonthData.netFlow >= 0
              ? "Positive this month"
              : "Negative this month"
            : "No data",
        },
        {
          id: "average-cash-flow",
          title: "Average Monthly Cash Flow",
          value:
            formatAmount({
              currency: data.currency,
              amount: Math.abs(data.metrics.averageMonthlyCashFlow || 0) || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: `Over ${cashFlowData.length} months`,
        },
        {
          id: "total-income",
          title: "Total Income",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.totalIncome || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "All periods combined",
        },
        {
          id: "total-expenses",
          title: "Total Expenses",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.totalExpenses || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "All periods combined",
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

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have cash flow data */}
          {showChart && (
            <CanvasChart
              title="Cash Flow Trend"
              legend={{
                items: [
                  { label: "Income", type: "solid" },
                  { label: "Expenses", type: "pattern" },
                  { label: "Net Flow", type: "solid" },
                  { label: "Cumulative", type: "dashed" },
                ],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <CashFlowChart
                data={cashFlowData}
                height={320}
                showLegend={false}
                showCumulative={true}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={cashFlowMetrics}
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
