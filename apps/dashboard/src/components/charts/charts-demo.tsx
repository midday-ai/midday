"use client";

import {
  BurnRateChart,
  CashFlowChart,
  ExpensesChart,
  ProfitChart,
  RevenueChart,
  RunwayChart,
  generateSampleData,
} from "./index";

export function ChartsDemo() {
  const burnRateData = generateSampleData.burnRate();
  const revenueData = generateSampleData.revenue();
  const profitData = generateSampleData.profit();
  const expensesData = generateSampleData.expenses();

  const runwayData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
    cashRemaining: Math.max(0, 200000 - i * 15000 + Math.random() * 10000),
    burnRate: Math.floor(Math.random() * 5000) + 12000,
    projectedCash: Math.max(0, 180000 - i * 18000),
  }));

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
    <div className="p-6 space-y-8 bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Chart Components Demo
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Burn Rate Chart */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Burn Rate Chart
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monthly cash burn rate with average trend line
            </p>
          </div>
          <div className="h-80 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <BurnRateChart
              data={burnRateData}
              showAnimation={true}
              chartReadyToAnimate={true}
            />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Revenue Chart
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monthly revenue trends with target comparison
            </p>
          </div>
          <div className="h-80 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <RevenueChart
              data={revenueData}
              showAnimation={true}
              showTarget={true}
            />
          </div>
        </div>

        {/* Profit Chart */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Profit Chart
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monthly profit trends with expense comparison
            </p>
          </div>
          <div className="h-80 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <ProfitChart
              data={profitData}
              showAnimation={true}
              showExpenses={true}
            />
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Expenses Chart
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monthly expenses breakdown
            </p>
          </div>
          <div className="h-80 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <ExpensesChart
              data={expensesData}
              showAnimation={true}
              chartType="bar"
            />
          </div>
        </div>

        {/* Runway Chart */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Runway Chart
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cash remaining over time with projections
            </p>
          </div>
          <div className="h-80 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <RunwayChart
              data={runwayData}
              showAnimation={true}
              showProjection={true}
              criticalThreshold={50000}
            />
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cash Flow Chart
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monthly cash inflow vs outflow with cumulative trends
            </p>
          </div>
          <div className="h-80 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <CashFlowChart
              data={cashFlowData}
              showAnimation={true}
              showCumulative={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
