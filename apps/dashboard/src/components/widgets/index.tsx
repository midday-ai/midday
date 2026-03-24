"use client";

import { use } from "react";
import { MetricsView } from "../metrics/metrics-view";
import type { ChartId } from "../metrics/utils/chart-types";
import { DEFAULT_CHART_ORDER } from "../metrics/utils/chart-types";
import { WidgetsHeader } from "./header";
import { McpBanner } from "./mcp-banner";

interface OverviewViewProps {
  chartOrderPromise?: Promise<ChartId[]>;
}

export function OverviewView({ chartOrderPromise }: OverviewViewProps) {
  const initialChartOrder = chartOrderPromise
    ? use(chartOrderPromise)
    : DEFAULT_CHART_ORDER;

  return (
    <div className="flex flex-col mt-6">
      <WidgetsHeader />
      <MetricsView initialChartOrder={initialChartOrder} />
      <McpBanner />
    </div>
  );
}
