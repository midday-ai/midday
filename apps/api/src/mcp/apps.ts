import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const require = createRequire(import.meta.url);
const DIST = join(
  dirname(require.resolve("@midday/mcp-apps/package.json")),
  "dist",
  "src",
  "views",
);

const views: Record<string, string> = {
  "ui://midday/time-series-chart": "time-series-chart.html",
  "ui://midday/spending-chart": "spending-chart.html",
  "ui://midday/balance-sheet": "balance-sheet.html",
  "ui://midday/invoice-preview": "invoice-preview.html",
};

export function registerMcpApps(server: McpServer): void {
  for (const [uri, file] of Object.entries(views)) {
    const html = readFileSync(join(DIST, file), "utf-8");

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
