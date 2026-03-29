import type { MCPClient } from "@ai-sdk/mcp";
import { createMCPClient } from "@ai-sdk/mcp";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { ToolIndex } from "toolpick";
import { createToolIndex } from "toolpick";

export type ChatMCPClient = Awaited<ReturnType<typeof createMCPClient>>;
type ToolDefinitions = Awaited<ReturnType<MCPClient["listTools"]>>;

let cachedDefinitions: ToolDefinitions | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tool generics from toolpick and ai-sdk are contravariant
let cachedIndex: ToolIndex<any> | null = null;

async function bootstrapTools(ctx: McpContext) {
  const mcpServer = createMcpServer(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await mcpServer.connect(serverTransport);

  const client = await createMCPClient({
    transport: clientTransport,
    name: "midday-bootstrap",
  });

  const definitions = await client.listTools();
  const tools = client.toolsFromDefinitions(definitions);
  await client.close();

  return { definitions, tools };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see cachedIndex
export async function ensureToolIndex(
  ctx: McpContext,
): Promise<ToolIndex<any>> {
  if (cachedIndex && cachedDefinitions) return cachedIndex;

  const { definitions, tools } = await bootstrapTools(ctx);
  cachedDefinitions = definitions;

  const index = await createToolIndex(tools);
  cachedIndex = index;

  return index;
}

export function getToolDefinitions(): ToolDefinitions {
  if (!cachedDefinitions) {
    throw new Error(
      "Tool definitions not bootstrapped — call ensureToolIndex first",
    );
  }
  return cachedDefinitions;
}

export async function createExecutionClient(ctx: McpContext) {
  const mcpServer = createMcpServer(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await mcpServer.connect(serverTransport);
  return createMCPClient({
    transport: clientTransport,
    name: "midday-chat",
  });
}
