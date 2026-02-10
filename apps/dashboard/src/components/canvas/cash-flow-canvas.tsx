"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { cashFlowArtifact } from "@api/ai/artifacts/cash-flow";
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
import { CashFlowChart } from "../charts";

export function CashFlowCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(cashFlowArtifact, { version });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale ?? undefined;

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
          value: formatCurrencyAmount(
            Math.abs(lastMonthData?.netFlow ?? 0) || 0,
            currency,
            locale,
          ),
          subtitle: lastMonthData
            ? lastMonthData.netFlow >= 0
              ? "Positive this month"
              : "Negative this month"
            : "No data",
        },
        {
          id: "average-cash-flow",
          title: "Average Monthly Cash Flow",
          value: formatCurrencyAmount(
            Math.abs(data.metrics.averageMonthlyCashFlow || 0) || 0,
            currency,
            locale,
          ),
          subtitle: `Over ${cashFlowData.length} months`,
        },
        {
          id: "total-income",
          title: "Total Income",
          value: formatCurrencyAmount(
            data.metrics.totalIncome || 0,
            currency,
            locale,
          ),
          subtitle: "All periods combined",
        },
        {
          id: "total-expenses",
          title: "Total Expenses",
          value: formatCurrencyAmount(
            data.metrics.totalExpenses || 0,
            currency,
            locale,
          ),
          subtitle: "All periods combined",
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
                currency={currency}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={cashFlowMetrics}
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
