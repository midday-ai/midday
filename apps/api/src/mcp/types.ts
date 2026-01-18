import type { Database } from "@midday/db/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface McpContext {
  db: Database;
  teamId: string;
}

export type RegisterTools = (server: McpServer, ctx: McpContext) => void;

// Common tool annotations for read-only tools
export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;
