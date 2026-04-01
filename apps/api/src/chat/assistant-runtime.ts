import { openai } from "@ai-sdk/openai";
import {
  buildPrepareStep,
  createExecutionClient,
  ensureToolIndex,
  getSearchTool,
  getToolDefinitions,
} from "@api/chat/tools";
import { getComposioTools } from "@api/composio/client";
import type { McpContext } from "@api/mcp/types";
import { logger } from "@midday/logger";
import { smoothStream, stepCountIs, ToolLoopAgent } from "ai";

type ModelMessages = Array<Record<string, unknown>>;

export async function streamMiddayAssistant(params: {
  mcpCtx: McpContext;
  systemPrompt: string;
  modelMessages: ModelMessages;
}) {
  const { mcpCtx, systemPrompt, modelMessages } = params;

  await ensureToolIndex(mcpCtx);

  const [resolvedClient, composioMetaTools] = await Promise.all([
    createExecutionClient(mcpCtx),
    getComposioTools(mcpCtx.userId),
  ]);

  try {
    const mcpTools = resolvedClient.toolsFromDefinitions(getToolDefinitions());
    const composioToolNames = Object.keys(composioMetaTools);

    if (composioToolNames.length > 0) {
      logger.info("[chat] Composio tools available:", {
        tools: composioToolNames,
      });
    }

    const agent = new ToolLoopAgent({
      model: openai("gpt-4.1-mini"),
      instructions: systemPrompt,
      tools: {
        ...mcpTools,
        ...composioMetaTools,
        search_tools: getSearchTool(),
        web_search: openai.tools.webSearch({
          searchContextSize: "medium",
          userLocation: {
            type: "approximate",
            country: mcpCtx.countryCode ?? undefined,
            timezone: mcpCtx.timezone ?? undefined,
          },
        }),
      },
      prepareStep: buildPrepareStep({
        maxTools: 12,
        alwaysActive: ["web_search", "search_tools", ...composioToolNames],
      }),
      stopWhen: stepCountIs(10),
      onFinish: async () => {
        await resolvedClient.close();
      },
    });

    return await agent.stream({
      messages: modelMessages as any,
      experimental_transform: smoothStream(),
    });
  } catch (error) {
    await resolvedClient.close().catch(() => {});
    throw error;
  }
}
