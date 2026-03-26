import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "../components/app-shell";
import { InvoiceTemplate } from "../invoice";
import { InvoiceSkeleton } from "../invoice/skeleton";
import "../globals.css";

function extractInvoiceData(
  result: CallToolResult,
): Record<string, any> | null {
  const structured = result.structuredContent as
    | Record<string, any>
    | undefined;
  return structured?.invoice ?? structured?.data ?? structured ?? null;
}

function InvoicePreviewApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Midday Invoice", version: "1.0.0" },
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
    return (
      <AppShell>
        <InvoiceSkeleton />
      </AppShell>
    );

  const data = extractInvoiceData(toolResult);

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground text-xs">
        No invoice data available
      </div>
    );
  }

  return (
    <AppShell>
      <InvoiceTemplate data={data} />
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvoicePreviewApp />
  </StrictMode>,
);
