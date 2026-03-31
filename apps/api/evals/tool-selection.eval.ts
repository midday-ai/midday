/**
 * Eval for chat tool selection quality
 *
 * Bootstraps the real MCP tool surface (108 tools) and tests that
 * toolpick's prepareStep selects the right tools for realistic
 * multi-turn conversation scenarios.
 *
 * Run: bun run eval        (watch mode)
 * Run: bun run eval:run    (single run)
 */
import "dotenv/config";
import { createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import { expandScopes } from "@api/utils/scopes";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { evalite } from "evalite";
import { createToolIndex, fileCache } from "toolpick";
import { allFixtures, type ToolSelectionFixture } from "./fixtures";
import {
  expectedToolsPresent,
  noToolsMissing,
  selectionPrecision,
} from "./scorers";

const MAX_TOOLS = 12;

async function bootstrapToolIndex() {
  const ctx: McpContext = {
    db: {} as McpContext["db"],
    teamId: "eval-team",
    userId: "eval-user",
    userEmail: "eval@midday.ai",
    scopes: expandScopes(["apis.all"]) as McpContext["scopes"],
    apiUrl: "https://api.midday.ai",
    timezone: "UTC",
    locale: "en",
    countryCode: "US",
    dateFormat: "MM/dd/yyyy",
    timeFormat: 24,
  };

  const mcpServer = createMcpServer(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await mcpServer.connect(serverTransport);

  const client = await createMCPClient({
    transport: clientTransport,
    name: "eval-bootstrap",
  });

  const definitions = await client.listTools();
  const tools = client.toolsFromDefinitions(definitions);
  await client.close();

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

  return index;
}

const indexPromise = bootstrapToolIndex();

evalite("Chat Tool Selection", {
  data: allFixtures.map((f) => ({
    input: f,
    expected: f.expected,
    name: f.name,
  })),

  task: async (fixture: ToolSelectionFixture) => {
    const index = await indexPromise;
    const prepareStep = index.prepareStep({ maxTools: MAX_TOOLS });

    const step = await prepareStep({
      messages: fixture.messages,
      steps: [],
      stepNumber: fixture.stepNumber ?? 0,
      model: {} as any,
      experimental_context: undefined,
    });

    return (step?.activeTools as string[]) ?? [];
  },

  scorers: [expectedToolsPresent, noToolsMissing, selectionPrecision],
});
