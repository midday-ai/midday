"use client";

import { use, useState } from "react";
import { MetricsView } from "../metrics/metrics-view";
import type { ChartLayoutItem } from "../metrics/utils/chart-types";
import { DEFAULT_CHART_LAYOUT } from "../metrics/utils/chart-types";
import { WidgetsHeader } from "./header";
import { McpBanner } from "./mcp-banner";

interface OverviewViewProps {
  chartLayoutPromise?: Promise<ChartLayoutItem[]>;
}

export function OverviewView({ chartLayoutPromise }: OverviewViewProps) {
  const initialLayout = chartLayoutPromise
    ? use(chartLayoutPromise)
    : DEFAULT_CHART_LAYOUT;

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col mt-6">
      <WidgetsHeader
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing((prev) => !prev)}
      />
      <MetricsView initialLayout={initialLayout} isEditing={isEditing} />
      <McpBanner />
    </div>
  );
}
