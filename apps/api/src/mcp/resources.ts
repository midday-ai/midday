import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "@midday/categories";
import { getTags, getTeamById } from "@midday/db/queries";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type McpContext, hasScope } from "./types";

// UI chart resource definitions
const UI_CHARTS = [
  {
    id: "spending-chart",
    name: "Spending Chart",
    description: "Spending breakdown by category donut chart",
  },
  {
    id: "burn-rate-chart",
    name: "Burn Rate Chart",
    description: "Monthly burn rate area chart",
  },
  {
    id: "cash-flow-chart",
    name: "Cash Flow Chart",
    description: "Income vs expenses bar chart",
  },
  {
    id: "revenue-chart",
    name: "Revenue Chart",
    description: "Revenue comparison bar chart",
  },
  {
    id: "profit-chart",
    name: "Profit Chart",
    description: "Profit comparison bar chart",
  },
  {
    id: "runway-gauge",
    name: "Runway Gauge",
    description: "Runway months gauge visualization",
  },
  {
    id: "forecast-chart",
    name: "Forecast Chart",
    description: "Revenue forecast line chart",
  },
  {
    id: "growth-rate-chart",
    name: "Growth Rate Chart",
    description: "Growth rate comparison bar chart",
  },
  {
    id: "profit-margin-chart",
    name: "Profit Margin Chart",
    description: "Profit margin trend line chart",
  },
  {
    id: "invoice-status-chart",
    name: "Invoice Status Chart",
    description: "Invoice status breakdown donut chart",
  },
];

function registerUIResources(server: McpServer): void {
  // Find the mcp-ui package bundle directory
  // In production, these would be bundled or served differently
  let bundleDir: string;

  try {
    // Try to resolve from node_modules
    const mcpUiPath = require.resolve("@midday/mcp-ui/package.json");
    bundleDir = resolve(dirname(mcpUiPath), "dist/bundles/src/apps/entries");
  } catch {
    // Fallback for development - relative path from apps/api
    const __dirname = dirname(fileURLToPath(import.meta.url));
    bundleDir = resolve(
      __dirname,
      "../../../../packages/mcp-ui/dist/bundles/src/apps/entries",
    );
  }

  for (const chart of UI_CHARTS) {
    const uri = `ui://midday/${chart.id}`;
    const htmlPath = resolve(bundleDir, `${chart.id}.html`);

    server.registerResource(
      `ui-${chart.id}`,
      uri,
      {
        description: chart.description,
        mimeType: "text/html",
      },
      async () => {
        // Read the HTML bundle
        if (!existsSync(htmlPath)) {
          return {
            contents: [
              {
                uri,
                mimeType: "text/html",
                text: `<html><body><p>Chart bundle not found. Run 'bun run build:bundles' in packages/mcp-ui</p></body></html>`,
              },
            ],
          };
        }

        const htmlContent = readFileSync(htmlPath, "utf-8");
        return {
          contents: [
            {
              uri,
              mimeType: "text/html",
              text: htmlContent,
            },
          ],
        };
      },
    );
  }
}

export function registerResources(server: McpServer, ctx: McpContext): void {
  const { db, teamId } = ctx;

  // Register UI chart resources for MCP Apps
  registerUIResources(server);

  // Team info requires teams.read scope
  if (hasScope(ctx, "teams.read")) {
    server.registerResource(
      "team",
      "midday://team/info",
      {
        description:
          "Current team information including name, base currency, and settings",
        mimeType: "application/json",
      },
      async () => {
        const team = await getTeamById(db, teamId);
        return {
          contents: [
            {
              uri: "midday://team/info",
              mimeType: "application/json",
              text: JSON.stringify(team, null, 2),
            },
          ],
        };
      },
    );
  }

  // Categories are static data, available to all authenticated users
  server.registerResource(
    "categories",
    "midday://categories",
    {
      description:
        "List of all transaction categories with their hierarchy, colors, and slugs",
      mimeType: "application/json",
    },
    async () => {
      return {
        contents: [
          {
            uri: "midday://categories",
            mimeType: "application/json",
            text: JSON.stringify(CATEGORIES, null, 2),
          },
        ],
      };
    },
  );

  // Tags require tags.read scope
  if (hasScope(ctx, "tags.read")) {
    server.registerResource(
      "tags",
      "midday://tags",
      {
        description: "List of all custom tags used for organizing data",
        mimeType: "application/json",
      },
      async () => {
        const tags = await getTags(db, { teamId });
        return {
          contents: [
            {
              uri: "midday://tags",
              mimeType: "application/json",
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      },
    );
  }
}
