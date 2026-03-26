import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { GenericAreaChart } from "../charts/area-chart";
import { GenericBarChart } from "../charts/bar-chart";
import { GenericDonutChart } from "../charts/donut-chart";
import { BalanceSheet } from "../components/balance-sheet";
import { ChartContainer } from "../components/chart-container";
import { DataTable } from "../components/data-table";
import { MetricGrid } from "../components/metric-grid";
import { InvoiceTemplate } from "../invoice";
import { formatAmount } from "../utils/format-amount";
import "../globals.css";
import {
  balanceSheetData,
  burnRateData,
  cashFlowData,
  forecastData,
  growthRateData,
  invoiceData,
  profitMarginData,
  recurringExpensesData,
  revenueData,
  spendingData,
  taxSummaryData,
} from "./mock-data";

function fmt(amount: number, currency?: string, locale?: string): string {
  if (!currency) return amount.toLocaleString(locale);
  return (
    formatAmount({ amount, currency, locale, maximumFractionDigits: 0 }) ??
    amount.toLocaleString(locale)
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border-color)",
        padding: 20,
        background: "var(--card-bg)",
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function RevenueDemo() {
  const { summary, result } = revenueData;
  const currency = summary.currency;
  const chartData = result.map((r) => ({
    date: r.date,
    current: r.current.value,
    previous: r.previous.value,
  }));

  return (
    <Section title="Revenue Report">
      <MetricGrid
        items={[
          {
            id: "current",
            title: "Current Period",
            value: fmt(summary.currentTotal, currency),
          },
          {
            id: "previous",
            title: "Previous Period",
            value: fmt(summary.prevTotal, currency),
          },
        ]}
        columns={2}
      />
      <ChartContainer
        title="Overview"
        legend={[
          { label: "Current", type: "solid" },
          { label: "Previous", type: "pattern" },
        ]}
      >
        <GenericBarChart
          data={chartData}
          xAxisKey="date"
          bars={[
            { dataKey: "current", fill: "primary", name: "Current" },
            { dataKey: "previous", fill: "pattern", name: "Previous" },
          ]}
          currency={currency}
        />
      </ChartContainer>
    </Section>
  );
}

function BurnRateDemo() {
  const currency = burnRateData.data[0]?.currency;
  const chartData = burnRateData.data.map((d) => ({
    date: d.date,
    value: d.value,
  }));

  return (
    <Section title="Burn Rate">
      <ChartContainer title="Burn Rate">
        <GenericBarChart
          data={chartData}
          xAxisKey="date"
          bars={[{ dataKey: "value", fill: "primary", name: "Burn Rate" }]}
          currency={currency}
        />
      </ChartContainer>
    </Section>
  );
}

function CashFlowDemo() {
  const d = cashFlowData.data;
  const chartData = d.periods.map((p) => ({
    period: p.period,
    income: p.income,
    expenses: Math.abs(p.expenses),
    netCashFlow: p.netCashFlow,
  }));

  return (
    <Section title="Cash Flow">
      <MetricGrid
        items={[
          {
            id: "income",
            title: "Total Income",
            value: fmt(d.totalIncome, d.currency),
          },
          {
            id: "expenses",
            title: "Total Expenses",
            value: fmt(Math.abs(d.totalExpenses), d.currency),
          },
          {
            id: "net",
            title: "Net Cash Flow",
            value: fmt(d.netCashFlow, d.currency),
          },
        ]}
        columns={3}
      />
      <ChartContainer
        title="Cash Flow"
        legend={[
          { label: "Income", type: "solid" },
          { label: "Expenses", type: "pattern" },
        ]}
      >
        <GenericBarChart
          data={chartData}
          xAxisKey="period"
          bars={[
            { dataKey: "income", fill: "primary", name: "Income" },
            { dataKey: "expenses", fill: "pattern", name: "Expenses" },
          ]}
          lines={[
            { dataKey: "netCashFlow", dashed: true, name: "Net Cash Flow" },
          ]}
          currency={d.currency}
        />
      </ChartContainer>
    </Section>
  );
}

function GrowthRateDemo() {
  const d = growthRateData.data;
  const chartData = d.monthlyBreakdown.map((p) => ({
    date: p.date,
    value: p.value,
    growth: p.growthPercentage,
  }));

  return (
    <Section title="Growth Rate">
      <MetricGrid
        items={[
          {
            id: "growth",
            title: "Growth Rate",
            value: `+${d.growthPercentage}%`,
            subtitle: d.trend,
          },
          {
            id: "current",
            title: "Current Period",
            value: fmt(d.currentPeriodTotal, d.currency),
          },
          {
            id: "previous",
            title: "Previous Period",
            value: fmt(d.previousPeriodTotal, d.currency),
          },
        ]}
        columns={3}
      />
      <ChartContainer title="Growth Rate">
        <GenericBarChart
          data={chartData}
          xAxisKey="date"
          bars={[{ dataKey: "value", fill: "primary", name: "Value" }]}
          lines={[
            { dataKey: "growth", name: "Growth %", dashed: true, dot: true },
          ]}
          dualYAxis={{ rightAxisId: "right", tickSuffix: "%" }}
          currency={d.currency}
        />
      </ChartContainer>
    </Section>
  );
}

function ProfitMarginDemo() {
  const d = profitMarginData.data;
  const chartData = d.monthlyBreakdown.map((p) => ({
    date: p.date,
    revenue: p.revenue,
    profit: p.profit,
    margin: p.margin,
  }));

  return (
    <Section title="Profit Margin">
      <MetricGrid
        items={[
          {
            id: "margin",
            title: "Overall Margin",
            value: `${d.overallMargin}%`,
            subtitle: d.trend,
          },
          {
            id: "revenue",
            title: "Revenue",
            value: fmt(d.totalRevenue, d.currency),
          },
          {
            id: "profit",
            title: "Profit",
            value: fmt(d.totalProfit, d.currency),
          },
        ]}
        columns={3}
      />
      <ChartContainer
        title="Profit Margin"
        legend={[
          { label: "Revenue", type: "solid" },
          { label: "Profit", type: "pattern" },
        ]}
      >
        <GenericBarChart
          data={chartData}
          xAxisKey="date"
          bars={[
            { dataKey: "revenue", fill: "primary", name: "Revenue" },
            { dataKey: "profit", fill: "pattern", name: "Profit" },
          ]}
          lines={[
            { dataKey: "margin", name: "Margin %", dashed: true, dot: true },
          ]}
          dualYAxis={{ rightAxisId: "right", tickSuffix: "%" }}
          currency={d.currency}
        />
      </ChartContainer>
    </Section>
  );
}

function ForecastDemo() {
  const { summary, combined } = forecastData;
  const currency = summary.currency;
  const chartData = combined.map((d) => ({
    date: d.date,
    actual: (d as Record<string, any>).actual ?? undefined,
    forecast: (d as Record<string, any>).forecast ?? undefined,
    upperBound: (d as Record<string, any>).upperBound ?? undefined,
    lowerBound: (d as Record<string, any>).lowerBound ?? undefined,
  }));

  const forecastStartDate = (() => {
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i]?.actual != null) return chartData[i]?.date;
    }
    return undefined;
  })();

  return (
    <Section title="Revenue Forecast">
      <MetricGrid
        items={[
          {
            id: "projected",
            title: "Projected Total",
            value: fmt(summary.projectedTotal, currency),
          },
          {
            id: "avg",
            title: "Historical Avg",
            value: fmt(summary.historicalAvg, currency),
          },
          {
            id: "confidence",
            title: "Confidence",
            value: `${summary.confidence}%`,
          },
        ]}
        columns={3}
      />
      <ChartContainer
        title="Revenue Forecast"
        legend={[
          { label: "Actual", type: "solid" },
          { label: "Forecast", type: "dashed" },
        ]}
      >
        <GenericAreaChart
          data={chartData}
          xAxisKey="date"
          lines={[
            {
              dataKey: "actual",
              dot: true,
              strokeWidth: 2,
            },
            {
              dataKey: "forecast",
              dashed: true,
              dot: true,
              connectNulls: true,
              color: "var(--chart-line-secondary)",
            },
          ]}
          confidenceBand={{ dataKeys: ["lowerBound", "upperBound"] }}
          referenceLine={
            forecastStartDate
              ? { x: forecastStartDate, label: "Forecast" }
              : undefined
          }
          currency={currency}
        />
      </ChartContainer>
    </Section>
  );
}

function RecurringExpensesDemo() {
  const items = recurringExpensesData.data;
  const currency = items[0]?.currency;
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Section title="Recurring Expenses">
      <MetricGrid
        items={[
          {
            id: "total",
            title: "Total Recurring",
            value: fmt(total, currency),
            subtitle: `${items.length} recurring expenses`,
          },
        ]}
        columns={1}
      />
      <DataTable
        columns={[
          { header: "Merchant", accessorKey: "name" },
          { header: "Amount", accessorKey: "amount", align: "right" },
          { header: "Frequency", accessorKey: "frequency" },
        ]}
        rows={items.map((i) => ({
          name: i.name,
          amount: fmt(i.amount, currency),
          frequency: i.frequency,
        }))}
      />
    </Section>
  );
}

function TaxSummaryDemo() {
  const items = taxSummaryData.data;
  const currency = items[0]?.currency;
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Section title="Tax Summary">
      <MetricGrid
        items={[
          {
            id: "total",
            title: "Total Tax",
            value: fmt(total, currency),
            subtitle: `${items.length} tax entries`,
          },
        ]}
        columns={1}
      />
      <DataTable
        columns={[
          { header: "Category", accessorKey: "category" },
          { header: "Type", accessorKey: "taxType" },
          { header: "Amount", accessorKey: "amount", align: "right" },
        ]}
        rows={items.map((i) => ({
          category: i.category,
          taxType: i.taxType,
          amount: fmt(i.amount, currency),
        }))}
      />
    </Section>
  );
}

function SpendingDemo() {
  const categories = spendingData.data;
  const currency = categories[0]?.currency;
  const totalSpending = categories.reduce((s, c) => s + c.amount, 0);

  const donutData = categories.map((c) => ({
    name: c.name,
    value: c.amount,
    percentage: c.percentage,
  }));

  return (
    <Section title="Spending by Category">
      <MetricGrid
        items={[
          {
            id: "total",
            title: "Total Spending",
            value: fmt(totalSpending, currency),
            subtitle: `${categories.length} categories`,
          },
        ]}
        columns={1}
      />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", minWidth: 280 }}>
          <GenericDonutChart
            data={donutData}
            height={280}
            currency={currency}
          />
        </div>
        <div style={{ flex: "1 1 300px", minWidth: 280, marginTop: 16 }}>
          <DataTable
            columns={[
              { header: "Category", accessorKey: "name" },
              { header: "Amount", accessorKey: "amount", align: "right" },
              { header: "%", accessorKey: "percentage", align: "right" },
            ]}
            rows={categories.map((c) => ({
              name: c.name,
              amount: fmt(c.amount, currency),
              percentage: `${c.percentage.toFixed(1)}%`,
            }))}
          />
        </div>
      </div>
    </Section>
  );
}

function BalanceSheetDemo() {
  const bs = balanceSheetData.data;
  return (
    <Section title="Balance Sheet">
      <BalanceSheet
        asOf={bs.asOf}
        currency={bs.currency}
        locale={bs.locale}
        assets={bs.assets}
        liabilities={bs.liabilities}
        equity={bs.equity}
        ratios={bs.ratios}
      />
    </Section>
  );
}

function InvoicePreviewDemo() {
  return (
    <Section title="Invoice Preview">
      <InvoiceTemplate data={invoiceData.data} />
    </Section>
  );
}

function DevGallery() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          MCP Apps — Dev Preview
        </h1>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            border: "1px solid var(--border-color)",
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <RevenueDemo />
        <BurnRateDemo />
        <CashFlowDemo />
        <GrowthRateDemo />
        <ProfitMarginDemo />
        <ForecastDemo />
        <RecurringExpensesDemo />
        <TaxSummaryDemo />
        <SpendingDemo />
        <BalanceSheetDemo />
        <InvoicePreviewDemo />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DevGallery />
  </StrictMode>,
);
