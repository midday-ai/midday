"use client";

import {
  BaseCanvas,
  CanvasChart,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { useCanvasData } from "@/components/canvas/hooks";
import {
  formatCurrencyAmount,
  shouldShowChart,
  shouldShowMetricsSkeleton,
  shouldShowSummarySkeleton,
} from "@/components/canvas/utils";
import { forecastArtifact } from "@api/ai/artifacts/forecast";
import { RevenueForecastChart } from "../charts";

export function ForecastCanvas() {
  const { data, isLoading, stage, currency, locale } =
    useCanvasData(forecastArtifact);

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
          subtitle: `${formatCurrencyAmount(
            data.metrics.peakMonthValue,
            currency,
            locale,
          )} projected`,
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
          value: formatCurrencyAmount(
            data.metrics.unpaidInvoices,
            currency,
            locale,
          ),
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

  const showChart = shouldShowChart(stage);
  const showSummarySkeleton = shouldShowSummarySkeleton(stage);

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
                currency={currency}
                locale={locale}
                forecastStartIndex={forecastStartIndex}
              />
            </CanvasChart>
          )}

          {/* Always show metrics section */}
          <CanvasGrid
            items={metrics}
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
