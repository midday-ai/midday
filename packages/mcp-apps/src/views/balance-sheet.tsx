import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BalanceSheet,
  type BalanceSheetProps,
} from "../components/balance-sheet";
import "../globals.css";

function BalanceSheetApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Midday Balance Sheet", version: "1.0.0" },
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
  const bs = (structured?.data ?? structured) as Record<string, any>;

  const props: BalanceSheetProps = {
    asOf: bs.asOf ?? new Date().toISOString().split("T")[0],
    currency: bs.currency ?? "USD",
    locale: bs.locale,
    assets: {
      current: bs.assets?.current ?? [],
      nonCurrent: bs.assets?.nonCurrent ?? [],
    },
    liabilities: {
      current: bs.liabilities?.current ?? [],
      nonCurrent: bs.liabilities?.nonCurrent ?? [],
    },
    equity: {
      items: bs.equity?.items ?? bs.equity ?? [],
    },
    ratios: bs.ratios,
  };

  return <BalanceSheet {...props} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BalanceSheetApp />
  </StrictMode>,
);
