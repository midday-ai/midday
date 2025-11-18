"use client";

import {
  BaseCanvas,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "@/components/canvas/base";
import { CanvasContent } from "@/components/canvas/base/canvas-content";
import { useUserQuery } from "@/hooks/use-user";
import { formatAmount } from "@/utils/format";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { runwayArtifact } from "@api/ai/artifacts/runway";

export function RunwayCanvas() {
  const { data, status } = useArtifact(runwayArtifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;

  const metrics = data?.metrics;
  const statusValue = metrics?.status;

  // Build metrics array with status indicator
  const runwayMetrics = metrics
    ? [
        {
          id: "current-runway",
          title: "Cash Runway",
          value: `${metrics.currentRunway || 0} months`,
          subtitle:
            statusValue === "healthy"
              ? "Healthy (12+ months)"
              : statusValue === "concerning"
                ? "Concerning (6-11 months)"
                : statusValue === "critical"
                  ? "Critical (<6 months)"
                  : stage === "loading"
                    ? "Loading..."
                    : "No data",
        },
        {
          id: "cash-balance",
          title: "Cash Balance",
          value:
            formatAmount({
              currency: data.currency,
              amount: metrics.cashBalance || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Current available cash",
        },
        {
          id: "average-burn-rate",
          title: "Average Burn Rate",
          value:
            formatAmount({
              currency: data.currency,
              amount: metrics.averageBurnRate || 0,
              locale: user?.locale,
            }) || "$0",
          subtitle: "Monthly spending average",
        },
        {
          id: "status",
          title: "Status",
          value:
            statusValue === "healthy"
              ? "Healthy"
              : statusValue === "concerning"
                ? "Concerning"
                : statusValue === "critical"
                  ? "Critical"
                  : "Unknown",
          subtitle:
            statusValue === "healthy"
              ? "Sufficient cash reserves"
              : statusValue === "concerning"
                ? "Monitor closely"
                : statusValue === "critical"
                  ? "Take immediate action"
                  : "No status available",
        },
      ]
    : [];

  const showSummarySkeleton = !stage || stage !== "analysis_ready";

  return (
    <BaseCanvas>
      <CanvasHeader title="Cash Runway" isLoading={isLoading} />

      <CanvasContent>
        <div className="space-y-8">
          {/* Always show metrics section */}
          <CanvasGrid
            items={runwayMetrics}
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
