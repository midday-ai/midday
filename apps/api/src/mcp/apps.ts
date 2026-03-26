import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const views: Record<string, string> = {
  "ui://midday/time-series-chart": "time-series-chart.html",
  "ui://midday/spending-chart": "spending-chart.html",
  "ui://midday/balance-sheet": "balance-sheet.html",
  "ui://midday/invoice-preview": "invoice-preview.html",
  "ui://midday/recurring-expenses": "recurring-expenses.html",
  "ui://midday/tax-summary": "tax-summary.html",
};

function resolveDist(): string | null {
  try {
    const require = createRequire(import.meta.url);
    const dist = join(
      dirname(require.resolve("@midday/mcp-apps/package.json")),
      "dist",
      "src",
      "views",
    );
    return existsSync(dist) ? dist : null;
  } catch {
    return null;
  }
}

export function registerMcpApps(server: McpServer): void {
  const dist = resolveDist();
  if (!dist) return;

  for (const [uri, file] of Object.entries(views)) {
    const filePath = join(dist, file);
    if (!existsSync(filePath)) continue;

    const html = readFileSync(filePath, "utf-8");

    registerAppResource(
      server,
      uri,
      uri,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => ({
        contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      }),
    );
  }
}
