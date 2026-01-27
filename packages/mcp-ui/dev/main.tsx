import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/styles/globals.css";

// Import all charts
import { SpendingChart } from "../src/components/charts/spending-chart";
import { BurnRateChart } from "../src/components/charts/burn-rate-chart";
import { CashFlowChart } from "../src/components/charts/cash-flow-chart";
import { RevenueChart } from "../src/components/charts/revenue-chart";
import { ProfitChart } from "../src/components/charts/profit-chart";
import { RunwayGauge } from "../src/components/charts/runway-gauge";
import { ForecastChart } from "../src/components/charts/forecast-chart";
import { GrowthRateChart } from "../src/components/charts/growth-rate-chart";
import { ProfitMarginChart } from "../src/components/charts/profit-margin-chart";
import { InvoiceStatusChart } from "../src/components/charts/invoice-status-chart";

// Sample data for each chart
const sampleData = {
  spending: {
    data: [
      { name: "Software & SaaS", slug: "software", amount: 4500, currency: "USD", percentage: 35 },
      { name: "Marketing", slug: "marketing", amount: 2800, currency: "USD", percentage: 22 },
      { name: "Office & Admin", slug: "office", amount: 1900, currency: "USD", percentage: 15 },
      { name: "Travel", slug: "travel", amount: 1500, currency: "USD", percentage: 12 },
      { name: "Equipment", slug: "equipment", amount: 1200, currency: "USD", percentage: 9 },
      { name: "Other", slug: "other", amount: 900, currency: "USD", percentage: 7 },
    ],
    currency: "USD",
  },
  burnRate: {
    data: [
      { date: "2024-01-01", value: 45000, currency: "USD" },
      { date: "2024-02-01", value: 52000, currency: "USD" },
      { date: "2024-03-01", value: 48000, currency: "USD" },
      { date: "2024-04-01", value: 51000, currency: "USD" },
      { date: "2024-05-01", value: 47000, currency: "USD" },
      { date: "2024-06-01", value: 55000, currency: "USD" },
    ],
    averageBurnRate: 49667,
    currency: "USD",
  },
  cashFlow: {
    data: [
      { month: "Jan", income: 85000, expenses: 45000, netCashFlow: 40000 },
      { month: "Feb", income: 92000, expenses: 52000, netCashFlow: 40000 },
      { month: "Mar", income: 78000, expenses: 48000, netCashFlow: 30000 },
      { month: "Apr", income: 95000, expenses: 51000, netCashFlow: 44000 },
      { month: "May", income: 88000, expenses: 47000, netCashFlow: 41000 },
      { month: "Jun", income: 102000, expenses: 55000, netCashFlow: 47000 },
    ],
    summary: {
      netCashFlow: 242000,
      totalIncome: 540000,
      totalExpenses: 298000,
      averageMonthlyCashFlow: 40333,
      currency: "USD",
    },
  },
  revenue: {
    data: [
      { date: "2024-01-01", current: { value: 85000, currency: "USD" }, previous: { value: 72000, currency: "USD" } },
      { date: "2024-02-01", current: { value: 92000, currency: "USD" }, previous: { value: 78000, currency: "USD" } },
      { date: "2024-03-01", current: { value: 78000, currency: "USD" }, previous: { value: 85000, currency: "USD" } },
      { date: "2024-04-01", current: { value: 95000, currency: "USD" }, previous: { value: 82000, currency: "USD" } },
      { date: "2024-05-01", current: { value: 88000, currency: "USD" }, previous: { value: 79000, currency: "USD" } },
      { date: "2024-06-01", current: { value: 102000, currency: "USD" }, previous: { value: 88000, currency: "USD" } },
    ],
    summary: { currentTotal: 540000, prevTotal: 484000, currency: "USD" },
  },
  profit: {
    data: [
      { date: "2024-01-01", current: { value: 40000, currency: "USD" }, previous: { value: 32000, currency: "USD" } },
      { date: "2024-02-01", current: { value: 40000, currency: "USD" }, previous: { value: 28000, currency: "USD" } },
      { date: "2024-03-01", current: { value: 30000, currency: "USD" }, previous: { value: 35000, currency: "USD" } },
      { date: "2024-04-01", current: { value: 44000, currency: "USD" }, previous: { value: 32000, currency: "USD" } },
      { date: "2024-05-01", current: { value: 41000, currency: "USD" }, previous: { value: 29000, currency: "USD" } },
      { date: "2024-06-01", current: { value: 47000, currency: "USD" }, previous: { value: 38000, currency: "USD" } },
    ],
    summary: { currentTotal: 242000, prevTotal: 194000, currency: "USD" },
  },
  runway: {
    months: 14,
    totalBalance: 700000,
    averageBurnRate: 50000,
    currency: "USD",
  },
  forecast: {
    historical: [
      { date: "2024-01-01", value: 85000, currency: "USD" },
      { date: "2024-02-01", value: 92000, currency: "USD" },
      { date: "2024-03-01", value: 78000, currency: "USD" },
      { date: "2024-04-01", value: 95000, currency: "USD" },
      { date: "2024-05-01", value: 88000, currency: "USD" },
      { date: "2024-06-01", value: 102000, currency: "USD" },
    ],
    forecast: [
      { date: "2024-07-01", value: 108000, currency: "USD", optimistic: 120000, pessimistic: 95000 },
      { date: "2024-08-01", value: 112000, currency: "USD", optimistic: 128000, pessimistic: 98000 },
      { date: "2024-09-01", value: 118000, currency: "USD", optimistic: 135000, pessimistic: 102000 },
    ],
    summary: {
      nextMonthProjection: 108000,
      avgMonthlyGrowthRate: 3.8,
      totalProjectedRevenue: 338000,
      currency: "USD",
    },
  },
  growthRate: {
    summary: {
      currentTotal: 540000,
      previousTotal: 484000,
      growthRate: 11.6,
      periodGrowthRate: 11.6,
      trend: "positive" as const,
      currency: "USD",
    },
    result: {
      current: {
        total: 540000,
        period: { from: "2024-01-01", to: "2024-06-30" },
        data: [
          { date: "2024-01-01", value: 85000 },
          { date: "2024-02-01", value: 92000 },
          { date: "2024-03-01", value: 78000 },
          { date: "2024-04-01", value: 95000 },
          { date: "2024-05-01", value: 88000 },
          { date: "2024-06-01", value: 102000 },
        ],
      },
      previous: {
        total: 484000,
        period: { from: "2023-01-01", to: "2023-06-30" },
        data: [
          { date: "2023-01-01", value: 72000 },
          { date: "2023-02-01", value: 78000 },
          { date: "2023-03-01", value: 85000 },
          { date: "2023-04-01", value: 82000 },
          { date: "2023-05-01", value: 79000 },
          { date: "2023-06-01", value: 88000 },
        ],
      },
    },
  },
  profitMargin: {
    data: [
      { date: "2024-01-01", profitMargin: 47.1, revenue: 85000, profit: 40000 },
      { date: "2024-02-01", profitMargin: 43.5, revenue: 92000, profit: 40000 },
      { date: "2024-03-01", profitMargin: 38.5, revenue: 78000, profit: 30000 },
      { date: "2024-04-01", profitMargin: 46.3, revenue: 95000, profit: 44000 },
      { date: "2024-05-01", profitMargin: 46.6, revenue: 88000, profit: 41000 },
      { date: "2024-06-01", profitMargin: 46.1, revenue: 102000, profit: 47000 },
    ],
    summary: {
      averageMargin: 44.7,
      trend: "up" as const,
      highestMargin: { date: "2024-01-01", value: 47.1 },
      lowestMargin: { date: "2024-03-01", value: 38.5 },
    },
  },
  invoiceStatus: {
    totalCount: 45,
    totalAmount: 125000,
    statuses: [
      { status: "paid", count: 28, amount: 78000 },
      { status: "unpaid", count: 10, amount: 32000 },
      { status: "overdue", count: 4, amount: 12000 },
      { status: "draft", count: 3, amount: 3000 },
    ],
    currency: "USD",
  },
};

type ChartType =
  | "spending"
  | "burnRate"
  | "cashFlow"
  | "revenue"
  | "profit"
  | "runway"
  | "forecast"
  | "growthRate"
  | "profitMargin"
  | "invoiceStatus";

const charts: { id: ChartType; name: string }[] = [
  { id: "spending", name: "Spending" },
  { id: "burnRate", name: "Burn Rate" },
  { id: "cashFlow", name: "Cash Flow" },
  { id: "revenue", name: "Revenue" },
  { id: "profit", name: "Profit" },
  { id: "runway", name: "Runway" },
  { id: "forecast", name: "Forecast" },
  { id: "growthRate", name: "Growth Rate" },
  { id: "profitMargin", name: "Profit Margin" },
  { id: "invoiceStatus", name: "Invoice Status" },
];

function ChartPreview({ chartId }: { chartId: ChartType }) {
  switch (chartId) {
    case "spending":
      return <SpendingChart data={sampleData.spending.data} currency={sampleData.spending.currency} />;
    case "burnRate":
      return (
        <BurnRateChart
          data={sampleData.burnRate.data}
          averageBurnRate={sampleData.burnRate.averageBurnRate}
          currency={sampleData.burnRate.currency}
        />
      );
    case "cashFlow":
      return <CashFlowChart data={sampleData.cashFlow.data} summary={sampleData.cashFlow.summary} />;
    case "revenue":
      return <RevenueChart data={sampleData.revenue.data} summary={sampleData.revenue.summary} />;
    case "profit":
      return <ProfitChart data={sampleData.profit.data} summary={sampleData.profit.summary} />;
    case "runway":
      return (
        <RunwayGauge
          months={sampleData.runway.months}
          totalBalance={sampleData.runway.totalBalance}
          averageBurnRate={sampleData.runway.averageBurnRate}
          currency={sampleData.runway.currency}
        />
      );
    case "forecast":
      return (
        <ForecastChart
          historical={sampleData.forecast.historical}
          forecast={sampleData.forecast.forecast}
          summary={sampleData.forecast.summary}
        />
      );
    case "growthRate":
      return (
        <GrowthRateChart
          summary={sampleData.growthRate.summary}
          result={sampleData.growthRate.result}
        />
      );
    case "profitMargin":
      return <ProfitMarginChart data={sampleData.profitMargin.data} summary={sampleData.profitMargin.summary} />;
    case "invoiceStatus":
      return (
        <InvoiceStatusChart
          totalCount={sampleData.invoiceStatus.totalCount}
          totalAmount={sampleData.invoiceStatus.totalAmount}
          statuses={sampleData.invoiceStatus.statuses}
          currency={sampleData.invoiceStatus.currency}
        />
      );
  }
}

function App() {
  const [selectedChart, setSelectedChart] = useState<ChartType>("spending");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  return (
    <div className={theme} data-theme={theme}>
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">MCP-UI Chart Development</h1>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {charts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => setSelectedChart(chart.id)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedChart === chart.id
                    ? "bg-blue-600 text-white"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {chart.name}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-6">
            <h2 className="text-lg font-semibold mb-4">
              {charts.find((c) => c.id === selectedChart)?.name}
            </h2>
            <div className="bg-background rounded-md p-4 min-h-[400px]">
              <ChartPreview chartId={selectedChart} />
            </div>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>
              This dev server renders charts directly with React components.
              Edit components in <code className="bg-muted px-1 rounded">src/components/charts/</code> to see live changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
