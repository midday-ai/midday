import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import {
  registerBankAccountTools,
  registerCustomerTools,
  registerDocumentTools,
  registerInboxTools,
  registerInsightTools,
  registerInvoiceTools,
  registerReportTools,
  registerSearchTools,
  registerTagTools,
  registerTeamTools,
  registerTrackerTools,
  registerTransactionTools,
} from "./tools";
import type { McpContext } from "./types";

export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer({
    name: "midday",
    version: "1.0.0",
  });

  // Register resources (static/semi-static data)
  registerResources(server, ctx);

  // Register prompts (analysis templates)
  registerPrompts(server);

  // Register tools by domain
  registerTransactionTools(server, ctx);
  registerInvoiceTools(server, ctx);
  registerCustomerTools(server, ctx);
  registerBankAccountTools(server, ctx);
  registerDocumentTools(server, ctx);
  registerTrackerTools(server, ctx);
  registerReportTools(server, ctx);
  registerSearchTools(server, ctx);
  registerInboxTools(server, ctx);
  registerInsightTools(server, ctx);
  registerTagTools(server, ctx);
  registerTeamTools(server, ctx);

  return server;
}
