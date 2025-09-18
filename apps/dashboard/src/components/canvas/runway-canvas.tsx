"use client";

import { BaseCanvas } from "@/components/canvas/base";
import { RunwayChart } from "../charts";

export function RunwayCanvas() {
  // Generate sample runway data
  const runwayData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
    cashRemaining: Math.max(0, 200000 - i * 15000 + Math.random() * 10000),
    burnRate: Math.floor(Math.random() * 5000) + 12000,
    projectedCash: Math.max(0, 180000 - i * 18000),
  }));

  return (
    <BaseCanvas>
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cash Runway Analysis
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cash remaining over time with projections and critical thresholds
          </p>
        </div>
        <div className="h-96">
          <RunwayChart
            data={runwayData}
            showAnimation={true}
            showProjection={true}
            criticalThreshold={50000}
          />
        </div>
      </div>
    </BaseCanvas>
  );
}
