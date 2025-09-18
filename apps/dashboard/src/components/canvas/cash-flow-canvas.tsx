"use client";

import { BaseCanvas } from "@/components/canvas/base";
import { CashFlowChart } from "../charts";

export function CashFlowCanvas() {
  // Generate sample cash flow data
  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const inflow = Math.floor(Math.random() * 20000) + 15000;
    const outflow = Math.floor(Math.random() * 15000) + 10000;
    const netFlow = inflow - outflow;
    const cumulativeFlow = i === 0 ? netFlow : netFlow + i * 2000;

    return {
      month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
      inflow,
      outflow,
      netFlow,
      cumulativeFlow,
    };
  });

  return (
    <BaseCanvas>
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cash Flow Analysis
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly cash inflow vs outflow with cumulative trends
          </p>
        </div>
        <div className="h-96">
          <CashFlowChart
            data={cashFlowData}
            showAnimation={true}
            showCumulative={true}
          />
        </div>
      </div>
    </BaseCanvas>
  );
}
