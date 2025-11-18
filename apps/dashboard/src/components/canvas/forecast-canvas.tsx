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
import { forecastArtifact } from "@api/ai/artifacts/forecast";
import { RevenueForecastChart } from "../charts";

export function ForecastCanvas() {
  const { data, status } = useArtifact(forecastArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  // Use artifact data or fallback to empty/default values
  const forecastData =
    data?.chart?.monthlyData?.map((item) => ({
      month: item.month,
      actual: item.actual,
      forecasted: item.forecasted > 0 ? item.forecasted : undefined,
      date: item.date,
    })) || [];

  const forecastStartIndex = data?.chart?.forecastStartIndex;

  const metrics = data?.metrics
    ? [
        {
          id: "peak-month",
          title: "Peak Month",
          value: data.metrics.peakMonth,
          subtitle: `${formatAmount({
            currency: data.currency,
            amount: data.metrics.peakMonthValue,
            locale: user?.locale,
          })} projected`,
        },
        {
          id: "growth-rate",
          title: "Growth Rate",
          value: `${data.metrics.growthRate}%`,
          subtitle: "Average monthly",
        },
        {
          id: "unpaid-invoices",
          title: "Unpaid Invoices",
          value:
            formatAmount({
              currency: data.currency,
              amount: data.metrics.unpaidInvoices,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Pending collection",
        },
        {
          id: "billable-hours",
          title: "Billable Hours",
          value: `${data.metrics.billableHours}h`,
          subtitle: "This month tracked",
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
          {/* Show chart as soon as we have forecast data */}
          {showChart && (
            <CanvasChart
              title="Revenue Forecast"
              legend={{
                items: [
                  {
                    label: "Actual",
                    type: "line",
                    lineStyle: "solid",
                    color: "white",
                  },
                  {
                    label: "Forecast",
                    type: "line",
                    lineStyle: "dashed",
                    color: "#666666",
                  },
                  {
                    label: "Forecast Start",
                    type: "line",
                    lineStyle: "reference",
                  },
                ],
              }}
              isLoading={stage === "loading"}
              height="20rem"
            >
              <RevenueForecastChart
                data={forecastData}
                height={320}
                currency={data?.currency || "USD"}
                locale={user?.locale ?? undefined}
                forecastStartIndex={forecastStartIndex}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={metrics}
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
