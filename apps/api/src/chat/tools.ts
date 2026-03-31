import type { MCPClient } from "@ai-sdk/mcp";
import { createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { PrepareStepFunction, Tool } from "ai";
import type { ToolIndex } from "toolpick";
import { createToolIndex, fileCache } from "toolpick";

export type ChatMCPClient = Awaited<ReturnType<typeof createMCPClient>>;
type ToolDefinitions = Awaited<ReturnType<MCPClient["listTools"]>>;

let cachedDefinitions: ToolDefinitions | null = null;
let cachedIndex: ToolIndex<any> | null = null;
let inflightIndexPromise: Promise<ToolIndex<any>> | null = null;

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

export function ensureToolIndex(
  ctx: McpContext,
): Promise<ToolIndex<any>> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  if (inflightIndexPromise) return inflightIndexPromise;

  inflightIndexPromise = (async () => {
    const { definitions, tools } = await bootstrapTools(ctx);
    cachedDefinitions = definitions;

    const index = await createToolIndex(tools, {
      embeddingModel: openai.embeddingModel("text-embedding-3-small"),
      embeddingCache: fileCache(".toolpick-cache.json"),
      relatedTools: {
        invoices_create: ["customers_list"],
        invoices_create_from_tracker: ["customers_list"],
        invoice_recurring_create: ["customers_list"],
        tracker_timer_start: ["tracker_projects_list"],
        tracker_entries_create: ["tracker_projects_list"],
        transactions_update: ["categories_list"],
      },
    });

    await index.warmUp();

    cachedIndex = index;
    return index;
  })().catch((err) => {
    inflightIndexPromise = null;
    throw err;
  });

  return inflightIndexPromise;
}

export function getToolDefinitions(): ToolDefinitions {
  if (!cachedDefinitions) {
    throw new Error(
      "Tool definitions not bootstrapped — call ensureToolIndex first",
    );
  }
  return cachedDefinitions;
}

/**
 * Build a prepareStep function that delegates to the cached tool index
 * but guarantees `alwaysActive` tool names are always exposed to the model.
 *
 * Toolpick's own `alwaysActive` option filters names against the index,
 * which excludes built-in provider tools like `web_search`. This wrapper
 * appends them after selection so they're never dropped.
 */
export function buildPrepareStep<T extends Record<string, Tool>>(options: {
  maxTools: number;
  alwaysActive?: string[];
}): PrepareStepFunction<T> {
  if (!cachedIndex) {
    throw new Error("Tool index not bootstrapped — call ensureToolIndex first");
  }

  const base = cachedIndex.prepareStep({ maxTools: options.maxTools });
  const always = options.alwaysActive ?? [];

  return (async (stepOptions: any) => {
    const step = await base(stepOptions);
    if (step?.activeTools && always.length > 0) {
      for (const name of always) {
        if (!step.activeTools.includes(name)) {
          step.activeTools.push(name);
        }
      }
    }
    return step;
  }) as PrepareStepFunction<T>;
}

export function getSearchTool() {
  if (!cachedIndex) {
    throw new Error("Tool index not bootstrapped — call ensureToolIndex first");
  }
  return cachedIndex.searchTool();
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
