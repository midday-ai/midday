import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GenericAreaChart } from "../charts/area-chart";
import { GenericBarChart } from "../charts/bar-chart";
import { ChartContainer } from "../components/chart-container";
import { MetricGrid } from "../components/metric-grid";
import { Section } from "../components/section";
import { detectReportType } from "../utils/detect-report-type";
import { formatAmount } from "../utils/format-amount";
import "../utils/theme.css";

interface PeriodResult {
  summary: Record<string, any>;
  meta: Record<string, any>;
  result: Record<string, any>[];
}

interface BurnRateResult {
  data: Array<{ date: string; value: number; currency: string }>;
}

interface CashFlowResult {
  data: Record<string, any>;
}

interface GrowthRateResult {
  data: Record<string, any>;
}

interface ProfitMarginResult {
  data: Record<string, any>;
}

interface ForecastResult {
  summary: Record<string, any>;
  historical: Record<string, any>[];
  forecast: Record<string, any>[];
  combined: Record<string, any>[];
  meta: Record<string, any>;
}

interface RecurringExpensesResult {
  data: Array<Record<string, any>>;
}

interface TaxSummaryResult {
  data: Array<Record<string, any>>;
}

function fmt(amount: number, currency?: string, locale?: string): string {
  if (!currency) return amount.toLocaleString(locale);
  return (
    formatAmount({
      amount,
      currency,
      locale,
      maximumFractionDigits: 0,
    }) ?? amount.toLocaleString(locale)
  );
}

function PeriodReport({ data }: { data: PeriodResult }) {
  const { summary, result } = data;
  const currency = summary?.currency;

  const chartData = result.map((r) => ({
    ...r,
    date: r.date,
    current: r.current?.value ?? r.current ?? r.value ?? 0,
    previous: r.previous?.value ?? r.previous ?? 0,
  }));

  const currentTotal =
    summary?.currentTotal ?? summary?.total ?? summary?.averageExpense ?? 0;
  const prevTotal = summary?.prevTotal ?? summary?.previousTotal ?? 0;

  const metrics = [
    {
      id: "current",
      title: "Current Period",
      value: fmt(currentTotal, currency),
    },
    ...(prevTotal
      ? [
          {
            id: "previous",
            title: "Previous Period",
            value: fmt(prevTotal, currency),
          },
        ]
      : []),
  ];

  const hasPrevious = chartData.some((d) => d.previous !== 0);

  return (
    <>
      <MetricGrid items={metrics} columns={metrics.length > 2 ? 3 : 2} />
      <ChartContainer
        title="Overview"
        legend={[
          { label: "Current", type: "solid" },
          ...(hasPrevious
            ? [{ label: "Previous", type: "pattern" as const }]
            : []),
        ]}
      >
        <GenericBarChart
          data={chartData}
          xAxisKey="date"
          bars={[
            { dataKey: "current", fill: "primary", name: "Current" },
            ...(hasPrevious
              ? [
                  {
                    dataKey: "previous",
                    fill: "pattern" as const,
                    name: "Previous",
                  },
                ]
              : []),
          ]}
          currency={currency}
        />
      </ChartContainer>
    </>
  );
}

function BurnRateReport({ data }: { data: BurnRateResult }) {
  const currency = data.data?.[0]?.currency;
  const chartData = data.data.map((d) => ({
    date: d.date,
    value: d.value,
  }));

  return (
    <ChartContainer title="Burn Rate">
      <GenericBarChart
        data={chartData}
        xAxisKey="date"
        bars={[{ dataKey: "value", fill: "primary", name: "Burn Rate" }]}
        currency={currency}
      />
    </ChartContainer>
  );
}

function CashFlowReport({ data }: { data: CashFlowResult }) {
  const d = data.data as any;
  const periods = d?.periods || [];
  const currency = d?.currency;

  const chartData = periods.map((p: any) => ({
    period: p.period || p.date,
    income: p.income ?? 0,
    expenses: Math.abs(p.expenses ?? 0),
    netCashFlow: p.netCashFlow ?? 0,
  }));

  const metrics = [
    ...(d?.totalIncome != null
      ? [
          {
            id: "income",
            title: "Total Income",
            value: fmt(d.totalIncome, currency),
          },
        ]
      : []),
    ...(d?.totalExpenses != null
      ? [
          {
            id: "expenses",
            title: "Total Expenses",
            value: fmt(Math.abs(d.totalExpenses), currency),
          },
        ]
      : []),
    ...(d?.netCashFlow != null
      ? [
          {
            id: "net",
            title: "Net Cash Flow",
            value: fmt(d.netCashFlow, currency),
          },
        ]
      : []),
  ];

  return (
    <>
      {metrics.length > 0 && <MetricGrid items={metrics} columns={3} />}
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
            {
              dataKey: "netCashFlow",
              dashed: true,
              name: "Net Cash Flow",
            },
          ]}
          currency={currency}
        />
      </ChartContainer>
    </>
  );
}

function GrowthRateReport({ data }: { data: GrowthRateResult }) {
  const d = data.data as any;
  const metrics = [
    {
      id: "growth",
      title: "Growth Rate",
      value: `${d.growthPercentage >= 0 ? "+" : ""}${d.growthPercentage?.toFixed(1)}%`,
      subtitle: d.trend ?? undefined,
    },
    ...(d.currentPeriodTotal != null
      ? [
          {
            id: "current",
            title: "Current Period",
            value: fmt(d.currentPeriodTotal, d.currency),
          },
        ]
      : []),
    ...(d.previousPeriodTotal != null
      ? [
          {
            id: "previous",
            title: "Previous Period",
            value: fmt(d.previousPeriodTotal, d.currency),
          },
        ]
      : []),
  ];

  const periods = d?.monthlyBreakdown || d?.periods || [];
  if (periods.length > 0) {
    const chartData = periods.map((p: any) => ({
      date: p.date || p.period,
      value: p.value ?? p.total ?? 0,
      growth: p.growthPercentage ?? p.growth ?? 0,
    }));
    return (
      <>
        <MetricGrid items={metrics} columns={3} />
        <ChartContainer title="Growth Rate">
          <GenericBarChart
            data={chartData}
            xAxisKey="date"
            bars={[{ dataKey: "value", fill: "primary", name: "Value" }]}
            lines={[
              {
                dataKey: "growth",
                name: "Growth %",
                dashed: true,
                dot: true,
              },
            ]}
            dualYAxis={{ rightAxisId: "right", tickSuffix: "%" }}
            currency={d.currency}
          />
        </ChartContainer>
      </>
    );
  }

  return <MetricGrid items={metrics} columns={metrics.length} />;
}

function ProfitMarginReport({ data }: { data: ProfitMarginResult }) {
  const d = data.data as any;
  const metrics = [
    {
      id: "margin",
      title: "Overall Margin",
      value: `${d.overallMargin?.toFixed(1)}%`,
      subtitle: d.trend ?? undefined,
    },
    ...(d.totalRevenue != null
      ? [
          {
            id: "revenue",
            title: "Revenue",
            value: fmt(d.totalRevenue, d.currency),
          },
        ]
      : []),
    ...(d.totalProfit != null
      ? [
          {
            id: "profit",
            title: "Profit",
            value: fmt(d.totalProfit, d.currency),
          },
        ]
      : []),
  ];

  const periods = d?.monthlyBreakdown || d?.periods || [];
  if (periods.length > 0) {
    const chartData = periods.map((p: any) => ({
      date: p.date || p.period,
      revenue: p.revenue ?? 0,
      profit: p.profit ?? 0,
      margin: p.margin ?? 0,
    }));
    return (
      <>
        <MetricGrid items={metrics} columns={3} />
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
              {
                dataKey: "margin",
                name: "Margin %",
                dashed: true,
                dot: true,
              },
            ]}
            dualYAxis={{ rightAxisId: "right", tickSuffix: "%" }}
            currency={d.currency}
          />
        </ChartContainer>
      </>
    );
  }

  return <MetricGrid items={metrics} columns={metrics.length} />;
}

function ForecastReport({ data }: { data: ForecastResult }) {
  const { summary, combined } = data;
  const currency = summary?.currency;

  const chartData = combined.map((d: any) => ({
    date: d.date || d.period,
    actual: d.actual ?? d.value ?? undefined,
    forecast: d.forecast ?? d.projected ?? undefined,
    upperBound: d.upperBound ?? d.confidenceHigh ?? undefined,
    lowerBound: d.lowerBound ?? d.confidenceLow ?? undefined,
  }));

  const hasConfidenceBand = chartData.some(
    (d) => d.upperBound != null && d.lowerBound != null,
  );

  const forecastStartDate = (() => {
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i]?.actual != null) return chartData[i]?.date;
    }
    return undefined;
  })();

  const metrics = [
    ...(summary?.projectedTotal != null
      ? [
          {
            id: "projected",
            title: "Projected Total",
            value: fmt(summary.projectedTotal, currency),
          },
        ]
      : []),
    ...(summary?.historicalAvg != null
      ? [
          {
            id: "avg",
            title: "Historical Avg",
            value: fmt(summary.historicalAvg, currency),
          },
        ]
      : []),
    ...(summary?.confidence != null
      ? [
          {
            id: "confidence",
            title: "Confidence",
            value: `${summary.confidence}%`,
          },
        ]
      : []),
  ];

  return (
    <>
      {metrics.length > 0 && <MetricGrid items={metrics} columns={3} />}
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
          confidenceBand={
            hasConfidenceBand
              ? { dataKeys: ["lowerBound", "upperBound"] }
              : undefined
          }
          referenceLine={
            forecastStartDate
              ? { x: forecastStartDate, label: "Forecast" }
              : undefined
          }
          currency={currency}
        />
      </ChartContainer>
    </>
  );
}

function RecurringExpensesReport({ data }: { data: RecurringExpensesResult }) {
  const items = data.data;
  const currency = items?.[0]?.currency;

  const total = items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const metrics = [
    {
      id: "total",
      title: "Total Recurring",
      value: fmt(total, currency),
      subtitle: `${items.length} recurring expenses`,
    },
  ];

  return (
    <>
      <MetricGrid items={metrics} columns={1} />
      <div style={{ marginTop: 16 }}>
        <table
          style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                Merchant
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "right",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                Frequency
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.name || item.merchant}-${item.amount}`}
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <td
                  style={{ padding: "8px 12px", color: "var(--text-primary)" }}
                >
                  {item.name || item.merchant}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                  }}
                >
                  {fmt(item.amount, currency)}
                </td>
                <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>
                  {item.frequency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TaxSummaryReport({ data }: { data: TaxSummaryResult }) {
  const items = data.data;
  const currency = items?.[0]?.currency;

  const total = items.reduce((s, i) => s + (i.amount ?? i.total ?? 0), 0);
  const metrics = [
    {
      id: "total",
      title: "Total Tax",
      value: fmt(total, currency),
      subtitle: `${items.length} tax entries`,
    },
  ];

  return (
    <>
      <MetricGrid items={metrics} columns={1} />
      <div style={{ marginTop: 16 }}>
        <table
          style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                Category
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                Type
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "right",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.category || item.name}-${item.taxType || item.type}`}
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <td
                  style={{ padding: "8px 12px", color: "var(--text-primary)" }}
                >
                  {item.category || item.name}
                </td>
                <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>
                  {item.taxType || item.type}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                  }}
                >
                  {fmt(item.amount ?? item.total ?? 0, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TimeSeriesChartApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Midday Charts", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app: McpApp) => {
      app.ontoolresult = async (result: CallToolResult) => {
        setToolResult(result);
      };
      app.onhostcontextchanged = (ctx) => {
        const theme = ctx?.theme === "dark" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
      };
    },
  });

  useEffect(() => {
    if (app) {
      const ctx = app.getHostContext();
      if (ctx?.theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    }
  }, [app]);

  if (error)
    return (
      <div style={{ color: "red", padding: 16 }}>Error: {error.message}</div>
    );
  if (!app || !toolResult)
    return (
      <div style={{ padding: 16, color: "var(--text-muted)" }}>Loading...</div>
    );

  const data = (toolResult.structuredContent ?? toolResult) as Record<
    string,
    any
  >;
  const reportType = detectReportType(data);

  switch (reportType) {
    case "period":
      return <PeriodReport data={data as PeriodResult} />;
    case "burn_rate":
      return <BurnRateReport data={data as BurnRateResult} />;
    case "cash_flow":
      return <CashFlowReport data={data as CashFlowResult} />;
    case "growth_rate":
      return <GrowthRateReport data={data as GrowthRateResult} />;
    case "profit_margin":
      return <ProfitMarginReport data={data as ProfitMarginResult} />;
    case "forecast":
      return <ForecastReport data={data as ForecastResult} />;
    case "recurring_expenses":
      return <RecurringExpensesReport data={data as RecurringExpensesResult} />;
    case "tax_summary":
      return <TaxSummaryReport data={data as TaxSummaryResult} />;
    default:
      return (
        <Section title="Report Data" content={JSON.stringify(data, null, 2)} />
      );
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimeSeriesChartApp />
  </StrictMode>,
);
