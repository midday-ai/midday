import type { Database } from "@midday/db/client";
import {
  claimComputerRun,
  getComputerAgentById,
  getUserTimezone,
  insertComputerRunSteps,
  updateComputerRun,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import type { Job } from "bullmq";
import {
  type ProposedAction,
  executeAgent,
  executeProposedActions,
} from "./runtime";

const logger = createLoggerWithContext("compute:worker");

interface ExecuteAgentJobData {
  agentId: string;
  teamId: string;
  runId: string;
  triggerType?: "manual" | "schedule";
  payload?: Record<string, unknown>;
}

interface ReplayProposalsJobData {
  runId: string;
  agentId: string;
  teamId: string;
  actions: ProposedAction[];
}

function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

type StepType =
  | "tool_call"
  | "ai_generation"
  | "memory_read"
  | "memory_write"
  | "notification"
  | "proposal"
  | "connector_call"
  | "context";

export async function processJob(job: Job, db: Database) {
  const data = job.data as ExecuteAgentJobData;
  const { agentId, teamId, runId, triggerType, payload } = data;

  logger.info("Processing compute job", { agentId, runId, teamId });

  try {
    const agent = await getComputerAgentById(db, { id: agentId });

    if (!agent) {
      logger.error("Agent not found", { agentId, runId });
      await updateComputerRun(db, {
        id: runId,
        status: "failed",
        error: "agent_not_found",
        completedAt: new Date(),
      });
      return;
    }

    const claimed = await claimComputerRun(db, { runId, agentId });

    if (!claimed) {
      logger.info("Skipping run -- agent already has an active run or run was already claimed", {
        agentId,
        runId,
      });
      await updateComputerRun(db, {
        id: runId,
        status: "failed",
        error: "skipped_concurrent",
        completedAt: new Date(),
      });
      return;
    }

    const userTimezone = agent.createdBy
      ? await getUserTimezone(db, { userId: agent.createdBy })
      : null;

    const result = await executeAgent({
      db,
      teamId,
      userId: agent.createdBy ?? "",
      agentId,
      agentName: agent.name,
      agentSlug: agent.slug,
      runId,
      code: agent.code,
      timezone: userTimezone,
      triggerContext: {
        type: triggerType ?? "manual",
        manual: triggerType !== "schedule",
        ...(payload ?? {}),
      },
    });

    if (result.steps.length > 0) {
      await insertComputerRunSteps(db, {
        runId,
        steps: result.steps.map((step) => ({
          type: step.type as StepType,
          name: step.name,
          input: step.input,
          output: step.output,
          durationMs: step.durationMs,
        })),
      });
    }

    if (result.proposalSubmitted) {
      logger.info("Agent submitted proposals, awaiting approval", {
        agentId,
        runId,
        steps: result.steps.length,
      });
    } else {
      await updateComputerRun(db, {
        id: runId,
        status: result.success ? "completed" : "failed",
        summary: result.success
          ? typeof result.result === "string"
            ? result.result
            : safeStringify(result.result)
          : null,
        error: result.error ?? null,
        toolCallCount: result.toolCallCount,
        llmCallCount: result.llmCallCount,
        completedAt: new Date(),
      });
    }

    logger.info("Compute job completed", {
      agentId,
      runId,
      success: result.success,
      proposalSubmitted: result.proposalSubmitted ?? false,
      toolCalls: result.toolCallCount,
      llmCalls: result.llmCallCount,
      steps: result.steps.length,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unexpected worker error";
    logger.error("processJob failed with unhandled error", {
      agentId,
      runId,
      error: errorMsg,
    });
    try {
      await updateComputerRun(db, {
        id: runId,
        status: "failed",
        error: errorMsg,
        completedAt: new Date(),
      });
    } catch (dbError) {
      logger.error("Failed to update run status after error", {
        runId,
        error: dbError instanceof Error ? dbError.message : "unknown",
      });
    }
  }
}

export async function processReplay(job: Job, db: Database) {
  const data = job.data as ReplayProposalsJobData;
  const { runId, agentId, teamId, actions } = data;

  logger.info("Processing replay job", { runId, agentId, actionCount: actions.length });

  try {
    const agent = await getComputerAgentById(db, { id: agentId });
    if (!agent) {
      logger.error("Agent not found for replay", { agentId, runId });
      await updateComputerRun(db, {
        id: runId,
        status: "failed",
        error: "agent_not_found",
        completedAt: new Date(),
      });
      return;
    }

    await updateComputerRun(db, { id: runId, status: "running" });

    const result = await executeProposedActions({
      db,
      teamId,
      userId: agent.createdBy ?? "",
      runId,
      actions,
    });

    if (result.steps.length > 0) {
      await insertComputerRunSteps(db, {
        runId,
        steps: result.steps.map((step) => ({
          type: step.type as StepType,
          name: step.name,
          input: step.input,
          output: step.output,
          durationMs: step.durationMs,
        })),
      });
    }

    logger.info("Replay job completed", {
      runId,
      agentId,
      success: result.success,
      toolCalls: result.toolCallCount,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unexpected replay error";
    logger.error("processReplay failed with unhandled error", {
      agentId,
      runId,
      error: errorMsg,
    });
    try {
      await updateComputerRun(db, {
        id: runId,
        status: "failed",
        error: errorMsg,
        completedAt: new Date(),
      });
    } catch (dbError) {
      logger.error("Failed to update run status after replay error", {
        runId,
        error: dbError instanceof Error ? dbError.message : "unknown",
      });
    }
  }
}
