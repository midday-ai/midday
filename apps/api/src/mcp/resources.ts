import { CATEGORIES } from "@midday/categories";
import { getTags, getTeamById } from "@midday/db/queries";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { hasScope, type McpContext } from "./types";

export function registerResources(server: McpServer, ctx: McpContext): void {
  const { db, teamId } = ctx;

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
