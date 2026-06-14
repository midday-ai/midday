import type { MCPClient } from "@ai-sdk/mcp";
import { createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import { SCOPES } from "@api/utils/scopes";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createTypeScriptTools } from "@secure-exec/typescript";
import { generateObject } from "ai";
import { createNodeDriver, createNodeRuntimeDriverFactory } from "secure-exec";
import { z } from "zod";

import { generateTypeStubs } from "./stubs";

const agentOutputSchema = z.object({
  name: z.string().describe("Human-readable agent name"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .describe("URL-safe slug for the agent"),
  description: z
    .string()
    .describe("One-line description of what the agent does"),
  scheduleCron: z
    .string()
    .nullable()
    .describe("Cron expression for scheduling, or null for manual-only"),
  plan: z
    .array(z.string())
    .describe("Human-readable step-by-step plan of what the agent will do"),
  toolsUsed: z
    .array(z.string())
    .describe("List of MCP tool names the agent will call"),
  code: z
    .string()
    .describe(
      "TypeScript async function body. Uses parseMcp() for type-safe tool results.",
    ),
});

export type GeneratedAgent = z.infer<typeof agentOutputSchema> & {
  compiledCode: string;
};

function buildSystemPrompt(typeStubs: string): string {
  return `You are the Midday Computer agent generator. You create TypeScript code that runs inside a secure V8 sandbox with access to Midday's business tools.

## Type Definitions

The following types are available in the sandbox environment. Use them for type-safe tool calls:

\`\`\`typescript
${typeStubs}
\`\`\`

## Code Pattern

Generate a TypeScript async function body (NOT an arrow function wrapper). The code executes directly inside the sandbox:

\`\`\`typescript
const { callTool, parseMcp, generateText, readMemory, writeMemory, notify, getTrigger, callConnector, propose } = SecureExec.bindings;

// Use parseMcp() to unwrap tool results with full type safety:
const result = await callTool("transactions_list", { start: "2024-01-01", end: "2024-12-31" });
const { meta, data } = parseMcp(result);
// data is Transaction[] with correct field names (camelCase)

// Use generateText for analysis and decision-making:
const analysis = await generateText("Analyze these transactions: " + JSON.stringify(data));

// Always assign the result to module.exports
module.exports = { summary: "What was done", itemsProcessed: data.length };
\`\`\`

## Rules

1. Always destructure bindings at the top
2. ALWAYS use parseMcp() to unwrap tool call results -- never access .content[0].text manually
3. All field names are camelCase (e.g. invoiceNumber, baseCurrency, customerId)
4. Handle empty results gracefully (don't error on no data)
5. Use generateText for analysis and decision-making, not just formatting
6. Use notify to proactively tell the team about important findings
7. Use readMemory/writeMemory to remember patterns across runs
8. Always assign the result to module.exports
9. Keep code concise and focused
10. Use try/catch around individual tool calls that might fail
11. Use callConnector for external services (Slack, Gmail, Sheets) -- only when the workflow needs external integrations
12. Use propose() for destructive write operations (sending invoices, bulk updates, deleting records) so the user can review first
13. Wrap JSON.parse of memory content in try/catch`;
}

async function createBootstrapMcpClient(): Promise<{
  client: MCPClient;
  cleanup: () => Promise<void>;
}> {
  const ctx: McpContext = {
    db: null as any,
    teamId: "stub",
    userId: "stub",
    userEmail: null,
    scopes: [...SCOPES],
    apiUrl: process.env.MIDDAY_API_URL || "https://api.midday.ai",
    timezone: null,
    locale: null,
    countryCode: null,
    dateFormat: null,
    timeFormat: null,
  };

  const server = createMcpServer(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = await createMCPClient({
    transport: clientTransport,
    name: "midday-codegen-bootstrap",
  });

  return {
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}

const MAX_REPAIR_ATTEMPTS = 2;

async function typecheckAndCompile(
  typeStubs: string,
  tsCode: string,
): Promise<{ success: true; js: string } | { success: false; diagnostics: string }> {
  const systemDriver = createNodeDriver({
    permissions: {
      fs: () => ({ allow: false }),
      network: () => ({ allow: false }),
    },
  });

  const runtimeDriverFactory = createNodeRuntimeDriverFactory();

  const tsTools = createTypeScriptTools({
    systemDriver,
    runtimeDriverFactory,
    memoryLimit: 128,
    cpuTimeLimitMs: 15_000,
  });

  const fullSource = `${typeStubs}\n\n// --- Agent Code ---\n${tsCode}`;

  const checkResult = await tsTools.typecheckSource({
    sourceText: fullSource,
    filePath: "agent.ts",
    compilerOptions: {
      target: "ES2022",
      module: "commonjs",
      strict: false,
      noEmit: true,
      skipLibCheck: true,
      allowJs: true,
    },
  });

  if (!checkResult.success) {
    const errors = checkResult.diagnostics
      .filter((d) => d.category === "error")
      .map((d) => `Line ${d.line ?? "?"}: ${d.message}`)
      .join("\n");
    return { success: false, diagnostics: errors };
  }

  const compileResult = await tsTools.compileSource({
    sourceText: tsCode,
    filePath: "agent.ts",
    compilerOptions: {
      target: "ES2022",
      module: "commonjs",
      strict: false,
      skipLibCheck: true,
      removeComments: true,
    },
  });

  if (!compileResult.outputText) {
    return { success: false, diagnostics: "Compilation produced no output" };
  }

  return { success: true, js: compileResult.outputText };
}

export async function generateAgentFromDescription(
  description: string,
): Promise<GeneratedAgent> {
  const { client: mcpClient, cleanup } = await createBootstrapMcpClient();

  try {
    const typeStubs = await generateTypeStubs(mcpClient);
    const systemPrompt = buildSystemPrompt(typeStubs);

    let tsCode: string;
    const { object } = await generateObject({
      model: openai("gpt-4.1"),
      schema: agentOutputSchema,
      system: systemPrompt,
      prompt: `Create a Midday Computer agent for the following request:\n\n"${description}"\n\nGenerate the agent configuration and TypeScript code.`,
    });

    tsCode = object.code;
    const agentMeta = object;

    let compiled = await typecheckAndCompile(typeStubs, tsCode);
    let attempts = 0;

    while (!compiled.success && attempts < MAX_REPAIR_ATTEMPTS) {
      attempts++;
      const { object: repaired } = await generateObject({
        model: openai("gpt-4.1"),
        schema: z.object({ code: z.string() }),
        system: systemPrompt,
        prompt: `The following TypeScript agent code has type errors. Fix them and return only the corrected code.\n\n## Original Code\n\`\`\`typescript\n${tsCode}\n\`\`\`\n\n## Type Errors\n${compiled.diagnostics}\n\nFix the errors and return the corrected code.`,
      });
      tsCode = repaired.code;
      compiled = await typecheckAndCompile(typeStubs, tsCode);
    }

    if (!compiled.success) {
      throw new Error(
        `Agent code failed type-checking after ${MAX_REPAIR_ATTEMPTS} repair attempts:\n${compiled.diagnostics}`,
      );
    }

    return {
      ...agentMeta,
      code: compiled.js,
      compiledCode: compiled.js,
    };
  } finally {
    await cleanup();
  }
}
