"use client";

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
import { DealPaymentChart } from "@/components/charts/deal-payment-chart";
import { useUserQuery } from "@/hooks/use-user";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { dealPaymentAnalysisArtifact } from "@api/ai/artifacts/deal-payment-analysis";
import { parseAsInteger, useQueryState } from "nuqs";

export function DealPaymentCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(dealPaymentAnalysisArtifact, {
    version,
  });
  const { data, status } = artifact;
  const { data: user } = useUserQuery();
  const isLoading = status === "loading";
  const stage = data?.stage;
  const locale = user?.locale ?? undefined;

  // Use artifact data or fallback to empty/default values
  const chartData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      averageDaysToPay: item.averageDaysToPay,
      paymentRate: item.paymentRate,
    })) || [];

  const paymentMetrics = data?.metrics
    ? [
        {
          id: "payment-score",
          title: "Payment Score",
          value: `${data.metrics.paymentScore.toFixed(0)}/100`,
          subtitle: "Overall payment performance",
        },
        {
          id: "average-days-to-pay",
          title: "Average Days to Pay",
          value: `${data.metrics.averageDaysToPay.toFixed(1)} days`,
          subtitle: "Time to receive payment",
        },
        {
          id: "payment-rate",
          title: "Payment Rate",
          value: `${data.metrics.paymentRate.toFixed(1)}%`,
          subtitle: "Percentage of deals paid",
        },
        {
          id: "overdue-rate",
          title: "Overdue Rate",
          value: `${data.metrics.overdueRate.toFixed(1)}%`,
          subtitle: "Percentage of overdue deals",
        },
      ]
    : [];

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

  return (
    <BaseCanvas>
      <CanvasHeader title="Deal Payment Analysis" />

      <CanvasContent>
        <div className="space-y-8">
          {/* Show chart as soon as we have data */}
          {showChart && (
            <CanvasChart
              title="Payment Trends"
              legend={{
                items: [
                  { label: "Avg Days to Pay", type: "solid" },
                  { label: "Payment Rate %", type: "line" },
                ],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <DealPaymentChart
                data={chartData}
                height={320}
                locale={locale}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={paymentMetrics}
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
