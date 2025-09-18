"use client";

import { BaseCanvas } from "@/components/canvas/base";
import { useState } from "react";
import { ExpensesChart, generateSampleData } from "../charts";

export function ExpensesCanvas() {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const expensesData = generateSampleData.expenses();

  return (
    <BaseCanvas>
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Expenses Analysis
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monthly expenses breakdown by category
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-3 py-1 text-xs rounded ${
                  chartType === "bar"
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                Bar Chart
              </button>
              <button
                type="button"
                onClick={() => setChartType("pie")}
                className={`px-3 py-1 text-xs rounded ${
                  chartType === "pie"
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                Pie Chart
              </button>
            </div>
          </div>
        </div>
        <div className="h-96">
          <ExpensesChart
            data={expensesData}
            showAnimation={true}
            chartType={chartType}
          />
        </div>
      </div>
    </BaseCanvas>
  );
}
