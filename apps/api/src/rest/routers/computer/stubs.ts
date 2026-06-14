import type { MCPClient } from "@ai-sdk/mcp";
import { compile } from "json-schema-to-typescript";

type ToolDef = Awaited<
  ReturnType<MCPClient["listTools"]>
>["tools"][number];

const BINDING_STUBS = `
declare const SecureExec: {
  bindings: {
    callTool: typeof callTool;
    parseMcp: (result: unknown) => any;
    generateText: (prompt: string, opts?: { model?: string; system?: string }) => Promise<string>;
    readMemory: (opts?: { key?: string; type?: string }) => Promise<Array<{ key: string; content: string; type: string | null; metadata: unknown }>>;
    writeMemory: (key: string, content: string, type?: string, metadata?: Record<string, unknown>) => Promise<void>;
    notify: (message: string, priority?: "low" | "normal" | "urgent") => Promise<void>;
    getTrigger: () => { type: "manual" | "schedule"; manual: boolean };
    callConnector: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
    propose: (actions: Array<{ tool: string; args: Record<string, unknown>; description?: string }>) => Promise<never>;
  };
};

declare const module: { exports: unknown };
`;

async function jsonSchemaToInterface(
  name: string,
  schema: Record<string, unknown>,
): Promise<string> {
  try {
    const ts = await compile(schema, name, {
      bannerComment: "",
      additionalProperties: false,
      unknownAny: false,
    });
    return ts;
  } catch {
    return `interface ${name} { [key: string]: any; }\n`;
  }
}

function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

async function generateToolOverload(tool: ToolDef): Promise<{
  interfaces: string;
  overload: string;
}> {
  const safeName = sanitizeToolName(tool.name);
  const interfaces: string[] = [];

  let inputType = "Record<string, unknown>";
  if (tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0) {
    const typeName = `${safeName}_Input`;
    const iface = await jsonSchemaToInterface(typeName, tool.inputSchema as Record<string, unknown>);
    interfaces.push(iface);
    inputType = typeName;
  }

  let outputType = "unknown";
  if (tool.outputSchema) {
    const typeName = `${safeName}_Output`;
    const iface = await jsonSchemaToInterface(typeName, tool.outputSchema as Record<string, unknown>);
    interfaces.push(iface);
    outputType = typeName;
  }

  const overload = `declare function callTool(name: "${tool.name}", args: ${inputType}): Promise<{ structuredContent?: ${outputType}; content?: Array<{ text?: string }>; isError?: boolean }>;`;

  return {
    interfaces: interfaces.join("\n"),
    overload,
  };
}

export async function generateTypeStubs(
  mcpClient: MCPClient,
): Promise<string> {
  const { tools } = await mcpClient.listTools();

  const results = await Promise.all(tools.map(generateToolOverload));

  const allInterfaces = results
    .map((r) => r.interfaces)
    .filter(Boolean)
    .join("\n");

  const allOverloads = results.map((r) => r.overload).join("\n");

  const fallbackOverload =
    "declare function callTool(name: string, args: Record<string, unknown>): Promise<{ structuredContent?: unknown; content?: Array<{ text?: string }>; isError?: boolean }>;";

  return [
    "// Auto-generated type stubs from MCP tool definitions",
    allInterfaces,
    allOverloads,
    fallbackOverload,
    BINDING_STUBS,
  ].join("\n\n");
}
