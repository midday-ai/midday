import { formatAmount } from "@midday/utils/format";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GenericDonutChart } from "../charts/donut-chart";
import { AppShell } from "../components/app-shell";
import { DataTable } from "../components/data-table";
import { MetricGrid } from "../components/metric-grid";
import "../globals.css";

interface SpendingCategory {
  name: string;
  slug?: string;
  amount: number;
  currency: string;
  color?: string;
  percentage: number;
}

function fmt(amount: number, currency?: string): string {
  if (!currency) return amount.toLocaleString();
  return (
    formatAmount({ amount, currency, maximumFractionDigits: 0 }) ??
    amount.toLocaleString()
  );
}

function SpendingChartApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Midday Spending", version: "1.0.0" },
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
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  if (!app || !toolResult)
    return <div className="p-4 text-muted-foreground">Loading...</div>;

  const structured = (toolResult.structuredContent ?? toolResult) as Record<
    string,
    any
  >;
  const categories: SpendingCategory[] = structured?.data ?? [];
  const currency = categories[0]?.currency;
  const totalSpending = categories.reduce((s, c) => s + c.amount, 0);

  const donutData = categories.map((c) => ({
    name: c.name,
    value: c.amount,
    percentage: c.percentage,
  }));

  const tableRows = categories.map((c) => ({
    name: c.name,
    amount: fmt(c.amount, currency),
    percentage: `${c.percentage.toFixed(1)}%`,
  }));

  return (
    <AppShell>
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
      <div className="flex gap-6 flex-wrap">
        <div className="flex-[1_1_300px] min-w-[280px]">
          <GenericDonutChart
            data={donutData}
            height={280}
            currency={currency}
          />
        </div>
        <div className="flex-[1_1_300px] min-w-[280px] mt-4">
          <DataTable
            columns={[
              { header: "Category", accessorKey: "name" },
              { header: "Amount", accessorKey: "amount", align: "right" },
              { header: "%", accessorKey: "percentage", align: "right" },
            ]}
            rows={tableRows}
          />
        </div>
      </div>
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpendingChartApp />
  </StrictMode>,
);
