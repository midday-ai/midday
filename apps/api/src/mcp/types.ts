import type { Scope } from "@api/utils/scopes";
import type { Database } from "@midday/db/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface McpContext {
  db: Database;
  teamId: string;
  userId: string;
  userEmail: string | null;
  scopes: Scope[];
  apiUrl: string;
  timezone: string | null;
  locale: string | null;
  countryCode: string | null;
  dateFormat: string | null;
  timeFormat: number | null;
}

export type RegisterTools = (server: McpServer, ctx: McpContext) => void;

export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Check if the context has the required scope for a tool
 */
export function hasScope(ctx: McpContext, requiredScope: Scope): boolean {
  return ctx.scopes.includes(requiredScope);
}
