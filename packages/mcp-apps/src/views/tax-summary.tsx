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

function TaxSummaryApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Midday Tax Summary", version: "1.0.0" },
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
  const total = items.reduce((s, i) => s + (i.amount ?? i.total ?? 0), 0);

  const tableRows = items.map((item) => ({
    category: item.category || item.name,
    type: item.taxType || item.type,
    amount: fmt(item.amount ?? item.total ?? 0, currency),
  }));

  return (
    <AppShell>
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
      <div className="mt-4">
        <DataTable
          columns={[
            { header: "Category", accessorKey: "category" },
            { header: "Type", accessorKey: "type" },
            { header: "Amount", accessorKey: "amount", align: "right" },
          ]}
          rows={tableRows}
        />
      </div>
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TaxSummaryApp />
  </StrictMode>,
);
