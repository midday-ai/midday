import { formatAmount } from "@midday/utils/format";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "../components/app-shell";
import { DataTable } from "../components/data-table";
import { MetricGrid } from "../components/metric-grid";
import "../globals.css";

function fmt(amount: number, currency?: string): string {
  if (!currency) return amount.toLocaleString();
  return (
    formatAmount({ amount, currency, maximumFractionDigits: 0 }) ??
    amount.toLocaleString()
  );
}

function RecurringExpensesApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Midday Recurring Expenses", version: "1.0.0" },
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
  const items: Record<string, any>[] = structured?.data ?? [];
  const currency = items[0]?.currency;
  const total = items.reduce((s, i) => s + (i.amount ?? 0), 0);

  const tableRows = items.map((item) => ({
    merchant: item.name || item.merchant,
    amount: fmt(item.amount, currency),
    frequency: item.frequency,
  }));

  return (
    <AppShell>
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
      <div className="mt-4">
        <DataTable
          columns={[
            { header: "Merchant", accessorKey: "merchant" },
            { header: "Amount", accessorKey: "amount", align: "right" },
            { header: "Frequency", accessorKey: "frequency" },
          ]}
          rows={tableRows}
        />
      </div>
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecurringExpensesApp />
  </StrictMode>,
);
