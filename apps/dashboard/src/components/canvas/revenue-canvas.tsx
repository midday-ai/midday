"use client";

import { BaseCanvas } from "@/components/canvas/base";
import { RevenueChart, generateSampleData } from "../charts";

export function RevenueCanvas() {
  const revenueData = generateSampleData.revenue();

  return (
    <BaseCanvas>
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Revenue Analysis
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly revenue trends with target comparison
          </p>
        </div>
        <div className="h-96">
          <RevenueChart
            data={revenueData}
            showAnimation={true}
            showTarget={true}
          />
        </div>
      </div>
    </BaseCanvas>
  );
}
