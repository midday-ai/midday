"use client";

import { use, useState } from "react";
import { MetricsView } from "@/components/metrics/metrics-view";
import type { ChartLayoutItem } from "@/components/metrics/utils/chart-types";
import { DEFAULT_CHART_LAYOUT } from "@/components/metrics/utils/chart-types";
import { WidgetsHeader } from "@/components/widgets/header";

interface MetricsContentProps {
  chartLayoutPromise: Promise<ChartLayoutItem[]>;
}

export function MetricsContent({ chartLayoutPromise }: MetricsContentProps) {
  const initialLayout = chartLayoutPromise
    ? use(chartLayoutPromise)
    : DEFAULT_CHART_LAYOUT;

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-end py-6">
        <WidgetsHeader
          isEditing={isEditing}
          onToggleEditing={() => setIsEditing((prev) => !prev)}
        />
      </div>
      <MetricsView initialLayout={initialLayout} isEditing={isEditing} />
    </div>
  );
}
