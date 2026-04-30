import { openai } from "@ai-sdk/openai";
import { getComposioTools } from "@api/composio/client";
import { createMcpServer } from "@api/mcp/server";
import type { McpContext } from "@api/mcp/types";
import { SCOPES } from "@api/utils/scopes";
import type { Database } from "@midday/db/client";
import {
  getAgentMemory,
  updateComputerRun,
  upsertAgentMemory,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { Notifications } from "@midday/notifications";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { generateText } from "ai";
import {
  type BindingTree,
  createNodeDriver,
  NodeExecutionDriver,
} from "secure-exec";
import { AGENT_LIMITS } from "./config";

const logger = createLoggerWithContext("compute:runtime");

export interface ProposedAction {
  tool: string;
  args: Record<string, unknown>;
  description?: string;
}

export class ProposalSubmittedError extends Error {
  public readonly actionCount: number;
  constructor(actionCount: number) {
    super(`Agent submitted ${actionCount} proposed action(s) for approval`);
    this.name = "ProposalSubmittedError";
    this.actionCount = actionCount;
  }
}

interface StepRecord {
  type: string;
  name: string;
  input: unknown;
  output: unknown;
  durationMs: number;
}

function createStepLogger(steps: StepRecord[]) {
  return {
    log(type: string, name: string, input: unknown) {
      const start = Date.now();
      return {
        done(output: unknown) {
          steps.push({
            type,
            name,
            input,
            output,
            durationMs: Date.now() - start,
          });
        },
      };
    },
  };
}

interface ExecuteAgentOptions {
  db: Database;
  teamId: string;
  userId: string;
  agentId: string;
  agentName: string;
  agentSlug: string;
  runId: string;
  code: string;
  timezone?: string | null;
  triggerContext?: Record<string, unknown>;
}

export interface ExecuteAgentResult {
  success: boolean;
  proposalSubmitted?: boolean;
  result?: unknown;
  error?: string;
  steps: StepRecord[];
  toolCallCount: number;
  llmCallCount: number;
}

async function createInProcessMcp(
  db: Database,
  teamId: string,
  userId: string,
  timezone?: string | null,
) {
  const mcpContext: McpContext = {
    db,
    teamId,
    userId,
    userEmail: null,
    scopes: [...SCOPES],
    apiUrl: process.env.MIDDAY_API_URL || "https://api.midday.ai",
    timezone: timezone ?? null,
    locale: null,
    countryCode: null,
    dateFormat: null,
    timeFormat: null,
  };

  const server = createMcpServer(mcpContext);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "midday-compute", version: "1.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server };
}

export async function executeAgent(
  options: ExecuteAgentOptions,
): Promise<ExecuteAgentResult> {
  const {
    db,
    teamId,
    userId,
    agentId,
    agentName,
    agentSlug,
    runId,
    code,
    timezone,
    triggerContext,
  } = options;
  const notifications = new Notifications(db);
  const steps: StepRecord[] = [];
  const stepLogger = createStepLogger(steps);
  let toolCallCount = 0;
  let llmCallCount = 0;

  const { client: mcpClient, server: mcpServer } = await createInProcessMcp(
    db,
    teamId,
    userId,
    timezone,
  );

  let driver: NodeExecutionDriver | null = null;

  try {
    const bindings: BindingTree = {
      parseMcp: (result: unknown) => {
        const r = result as {
          structuredContent?: unknown;
          content?: Array<{ text?: string }>;
          isError?: boolean;
        };
        if (r?.isError) {
          const errText = r?.content?.[0]?.text ?? "Tool call failed";
          throw new Error(errText);
        }
        if (r?.structuredContent !== undefined) return r.structuredContent;
        const text = r?.content?.[0]?.text;
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      },

      callTool: async (name: unknown, args: unknown) => {
        if (toolCallCount >= AGENT_LIMITS.maxToolCalls) {
          throw new Error(
            `Tool call limit exceeded (max ${AGENT_LIMITS.maxToolCalls})`,
          );
        }
        toolCallCount++;
        const toolName = name as string;
        const toolArgs = args as Record<string, unknown>;
        const step = stepLogger.log("tool_call", toolName, toolArgs);
        try {
          const result = await mcpClient.callTool({
            name: toolName,
            arguments: toolArgs,
          });
          step.done(result);
          return result;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Tool call failed";
          step.done({ error: msg });
          throw error;
        }
      },

      generateText: async (prompt: unknown, opts: unknown) => {
        if (llmCallCount >= AGENT_LIMITS.maxLlmCalls) {
          throw new Error(
            `LLM call limit exceeded (max ${AGENT_LIMITS.maxLlmCalls})`,
          );
        }
        llmCallCount++;
        const promptStr = prompt as string;
        const options = opts as { model?: string; system?: string } | undefined;
        const step = stepLogger.log("ai_generation", "generateText", {
          promptLength: promptStr.length,
          model: options?.model,
        });
        try {
          const { text } = await generateText({
            model: openai(options?.model ?? "gpt-4.1-mini"),
            system: options?.system,
            prompt: promptStr,
          });
          step.done({ textLength: text.length });
          return text;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "LLM call failed";
          step.done({ error: msg });
          throw error;
        }
      },

      readMemory: async (opts: unknown) => {
        const memOpts = opts as { key?: string; type?: string } | undefined;
        const step = stepLogger.log("memory_read", "readMemory", memOpts);
        try {
          const result = await getAgentMemory(db, {
            agentId,
            teamId,
            key: memOpts?.key,
            type: memOpts?.type,
          });
          step.done({ count: result.length });
          return result;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Memory read failed";
          step.done({ error: msg });
          throw error;
        }
      },

      writeMemory: async (
        key: unknown,
        content: unknown,
        type: unknown,
        metadata: unknown,
      ) => {
        const keyStr = key as string;
        const contentStr = content as string;
        const typeStr = type as string | undefined;
        const metadataObj = metadata as Record<string, unknown> | undefined;
        const step = stepLogger.log("memory_write", "writeMemory", {
          key: keyStr,
          type: typeStr,
        });
        try {
          await upsertAgentMemory(db, {
            agentId,
            teamId,
            key: keyStr,
            content: contentStr,
            type: typeStr ?? null,
            metadata: metadataObj ?? null,
          });
          step.done({ upserted: true });
          return { success: true };
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Memory write failed";
          step.done({ error: msg });
          throw error;
        }
      },

      getTrigger: () => {
        const step = stepLogger.log("context", "getTrigger", {});
        step.done(triggerContext ?? {});
        return triggerContext ?? {};
      },

      notify: async (message: unknown, priority: unknown) => {
        const messageStr = message as string;
        const priorityStr = (priority as string) ?? "normal";
        const step = stepLogger.log("notification", "notify", {
          priority: priorityStr,
          messageLength: messageStr.length,
        });
        try {
          await updateComputerRun(db, { id: runId, summary: messageStr });
          await notifications.create(
            "agent_alert",
            teamId,
            { agentName, agentSlug, runId, message: messageStr, priority: priorityStr as "low" | "normal" | "urgent" },
            { sendEmail: priorityStr === "urgent" },
          );
          step.done({ delivered: true });
          return { success: true };
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Notification failed";
          step.done({ error: msg });
          throw error;
        }
      },

      propose: async (actions: unknown) => {
        const actionList = actions as ProposedAction[];
        const step = stepLogger.log("proposal", "propose", {
          actionCount: actionList.length,
        });
        await updateComputerRun(db, {
          id: runId,
          proposedActions: actionList,
          status: "waiting_approval",
        });

        await notifications.create(
          "agent_alert",
          teamId,
          {
            agentName,
            agentSlug,
            runId,
            message: `${agentName} has ${actionList.length} proposed action(s) waiting for your approval.`,
            priority: "normal" as const,
          },
        );

        step.done({ submitted: true, actionCount: actionList.length });
        throw new ProposalSubmittedError(actionList.length);
      },

      callConnector: async (toolName: unknown, args: unknown) => {
        if (toolCallCount >= AGENT_LIMITS.maxToolCalls) {
          throw new Error(
            `Tool call limit exceeded (max ${AGENT_LIMITS.maxToolCalls})`,
          );
        }
        toolCallCount++;
        const name = toolName as string;
        const toolArgs = args as Record<string, unknown>;
        const step = stepLogger.log("connector_call", name, toolArgs);
        try {
          const composioTools = await getComposioTools(userId);
          const tool = composioTools[name] as
            | { execute?: (args: Record<string, unknown>) => Promise<unknown> }
            | undefined;
          if (!tool?.execute) {
            throw new Error(`Connector tool not found: ${name}. Ensure the user has connected the service.`);
          }
          const result = await tool.execute(toolArgs);
          step.done(result);
          return result;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Connector call failed";
          step.done({ error: msg });
          throw error;
        }
      },
    };

    const systemDriver = createNodeDriver({
      permissions: {
        fs: () => ({ allow: false }),
        network: () => ({ allow: false }),
      },
    });

    driver = new NodeExecutionDriver({
      system: systemDriver,
      runtime: systemDriver.runtime,
      memoryLimit: AGENT_LIMITS.memoryLimitMb,
      cpuTimeLimitMs: AGENT_LIMITS.cpuTimeLimitMs,
      bindings,
    });

    const result = await driver.run(code);

    return {
      success: true,
      result: result?.exports ?? result,
      steps,
      toolCallCount,
      llmCallCount,
    };
  } catch (error) {
    if (error instanceof ProposalSubmittedError) {
      logger.info("Agent submitted proposals for approval", {
        agentId,
        runId,
        actionCount: error.actionCount,
      });
      return {
        success: true,
        proposalSubmitted: true,
        steps,
        toolCallCount,
        llmCallCount,
      };
    }

    const errorMsg =
      error instanceof Error ? error.message : "Agent execution failed";
    logger.error("Agent execution failed", {
      agentId,
      runId,
      error: errorMsg,
    });
    return {
      success: false,
      error: errorMsg,
      steps,
      toolCallCount,
      llmCallCount,
    };
  } finally {
    try {
      driver?.dispose();
    } catch {
      // ignore cleanup errors
    }
    try {
      await mcpServer.close();
    } catch {
      // ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// Replay: execute approved proposed actions
// ---------------------------------------------------------------------------

interface ReplayOptions {
  db: Database;
  teamId: string;
  userId: string;
  runId: string;
  actions: ProposedAction[];
}

export async function executeProposedActions(
  options: ReplayOptions,
): Promise<ExecuteAgentResult> {
  const { db, teamId, userId, runId, actions } = options;
  const steps: StepRecord[] = [];
  const stepLogger = createStepLogger(steps);
  let toolCallCount = 0;

  const { client: mcpClient, server: mcpServer } = await createInProcessMcp(
    db,
    teamId,
    userId,
  );

  try {
    for (const action of actions) {
      toolCallCount++;
      const step = stepLogger.log("tool_call", action.tool, action.args);
      try {
        const result = await mcpClient.callTool({
          name: action.tool,
          arguments: action.args,
        });
        step.done(result);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Tool call failed";
        step.done({ error: msg });
        throw error;
      }
    }

    await updateComputerRun(db, {
      id: runId,
      status: "completed",
      toolCallCount,
      completedAt: new Date(),
    });

    return {
      success: true,
      steps,
      toolCallCount,
      llmCallCount: 0,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Replay execution failed";
    logger.error("Replay execution failed", { runId, error: errorMsg });

    await updateComputerRun(db, {
      id: runId,
      status: "failed",
      error: errorMsg,
      toolCallCount,
      completedAt: new Date(),
    });

    return {
      success: false,
      error: errorMsg,
      steps,
      toolCallCount,
      llmCallCount: 0,
    };
  } finally {
    try {
      await mcpServer.close();
    } catch {
      // ignore cleanup errors
    }
  }
}
