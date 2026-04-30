import { createLoggerWithContext } from "@midday/logger";
import { getQueue } from "./queues";

const logger = createLoggerWithContext("job-client:compute");

export const COMPUTE_QUEUE_NAME = "compute";

export interface EnqueueRunOptions {
  agentId: string;
  teamId: string;
  triggerType?: "manual" | "schedule";
  runId: string;
  payload?: Record<string, unknown>;
}

export interface EnqueueReplayOptions {
  runId: string;
  agentId: string;
  teamId: string;
  actions: Array<{ tool: string; args: Record<string, unknown>; description?: string }>;
}

export async function enqueueReplay(
  options: EnqueueReplayOptions,
): Promise<void> {
  const queue = getQueue(COMPUTE_QUEUE_NAME);
  const startTime = Date.now();

  try {
    const job = await queue.add("replay-proposals", options, {
      jobId: `replay:${options.runId}`,
      attempts: 1,
      removeOnComplete: { age: 7 * 24 * 3600, count: 5000 },
      removeOnFail: { age: 14 * 24 * 3600 },
    });

    if (!job?.id) {
      throw new Error(`Failed to enqueue replay for run: ${options.runId}`);
    }

    const duration = Date.now() - startTime;
    logger.info("Enqueued replay job", {
      runId: options.runId,
      agentId: options.agentId,
      actionCount: options.actions.length,
      jobId: job.id,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to enqueue replay", {
      runId: options.runId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function enqueueRun(options: EnqueueRunOptions): Promise<void> {
  const queue = getQueue(COMPUTE_QUEUE_NAME);
  const startTime = Date.now();

  try {
    const job = await queue.add("execute-agent", options, {
      jobId: `run:${options.runId}`,
      attempts: 1,
      removeOnComplete: { age: 7 * 24 * 3600, count: 5000 },
      removeOnFail: { age: 14 * 24 * 3600 },
    });

    if (!job?.id) {
      throw new Error(`Failed to enqueue run for agent: ${options.agentId}`);
    }

    const duration = Date.now() - startTime;
    logger.info("Enqueued compute run", {
      agentId: options.agentId,
      runId: options.runId,
      teamId: options.teamId,
      jobId: job.id,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Failed to enqueue compute run", {
      agentId: options.agentId,
      runId: options.runId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
